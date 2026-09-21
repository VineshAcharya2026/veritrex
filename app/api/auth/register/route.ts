import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { applySessionCookie, createSessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import { isBlacklisted } from "@/lib/blacklist";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/utils";
import { parseSkillInput } from "@/lib/skills";
import { sendRegistrationConfirmation } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();

    if (await isBlacklisted(email, data.phone)) {
      return NextResponse.json(
        { error: "Your account cannot be created. Contact support." },
        { status: 403 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    if ((data.role as string) === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const ip = getClientIp(request);
    const phone = data.phone?.trim() || undefined;

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: data.role,
          status: "ACTIVE",
          profile: {
            create: { firstName: data.firstName, lastName: data.lastName },
          },
          ...(data.role === "MENTOR"
            ? {
                mentorProfile: {
                  create: {
                    company: data.companyName,
                    title: data.title,
                    expertise: parseSkillInput(data.expertise),
                  },
                },
              }
            : {}),
          ...(data.role === "MENTEE"
            ? {
                menteeProfile: {
                  create: {
                    currentRole: data.currentRole,
                    goals: data.goals,
                    desiredSkills: parseSkillInput(data.desiredSkills),
                  },
                },
              }
            : {}),
        },
        include: { profile: true },
      });
      return created;
    });

    try {
      await logAudit({
        userId: user.id,
        action: "USER_REGISTERED",
        entity: "User",
        entityId: user.id,
        ipAddress: ip,
        metadata: { role: data.role },
      });
    } catch (auditErr) {
      console.error("[register] audit", auditErr);
    }

    try {
      await sendRegistrationConfirmation(email, data.firstName);
    } catch {
      // non-blocking when SMTP is not configured
    }

    const name = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.email;

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      name,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          name,
        },
      },
      { status: 201 }
    );
    applySessionCookie(response, token, request);
    return response;
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
