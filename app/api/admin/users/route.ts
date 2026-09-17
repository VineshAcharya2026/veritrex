import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/utils";
import { parseSkillInput } from "@/lib/skills";
import { z } from "zod";
import { optionalPhoneSchema } from "@/lib/validators/phone";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: optionalPhoneSchema,
  role: z.enum(["MENTOR", "MENTEE"]),
  companyName: z.string().optional(),
  title: z.string().optional(),
  expertise: z.string().optional(),
  currentRole: z.string().optional(),
  goals: z.string().optional(),
  desiredSkills: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "FROZEN"]).optional(),
});

export async function GET(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const status = searchParams.get("status");

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as "MENTOR" | "MENTEE" | "SUPER_ADMIN" } : {}),
      ...(status ? { status: status as "PENDING" | "ACTIVE" | "SUSPENDED" | "FROZEN" | "DELETED" } : {}),
    },
    include: { profile: true, mentorProfile: true, menteeProfile: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return error;

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      phone: data.phone?.trim() || undefined,
      passwordHash,
      role: data.role,
      status: data.status ?? "ACTIVE",
      profile: { create: { firstName: data.firstName, lastName: data.lastName } },
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
    include: { profile: true, mentorProfile: true, menteeProfile: true },
  });

  await logAudit({
    userId: session.user.id,
    action: "USER_CREATED",
    entity: "User",
    entityId: user.id,
    ipAddress: getClientIp(request),
    metadata: { role: data.role },
  });

  return NextResponse.json(user, { status: 201 });
}
