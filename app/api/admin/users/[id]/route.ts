import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/utils";
import { parseSkillInput } from "@/lib/skills";
import { z } from "zod";
import { optionalPhoneSchema } from "@/lib/validators/phone";

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: optionalPhoneSchema,
  role: z.enum(["MENTOR", "MENTEE"]).optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "FROZEN", "DELETED"]).optional(),
  password: z.string().min(8).optional(),
  companyName: z.string().optional(),
  title: z.string().optional(),
  expertise: z.string().optional(),
  currentRole: z.string().optional(),
  goals: z.string().optional(),
  desiredSkills: z.string().optional(),
  maxMentees: z.number().int().positive().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      mentorProfile: true,
      menteeProfile: true,
      memberReflection: true,
      mentorSessions: { include: { mentee: { include: { profile: true } } }, take: 10 },
      menteeSessions: { include: { mentor: { include: { profile: true } } }, take: 10 },
      _count: { select: { loginEvents: true, auditLogs: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return error;

  const existing = await prisma.user.findUnique({
    where: { id },
    include: { profile: true, mentorProfile: true, menteeProfile: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot modify super admin" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : undefined;

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(passwordHash ? { passwordHash } : {}),
        ...(data.firstName || data.lastName
          ? {
              profile: {
                update: {
                  ...(data.firstName ? { firstName: data.firstName } : {}),
                  ...(data.lastName ? { lastName: data.lastName } : {}),
                },
              },
            }
          : {}),
      },
      include: { profile: true, mentorProfile: true, menteeProfile: true },
    });

    if (updated.role === "MENTOR" && updated.mentorProfile) {
      await tx.mentorProfile.update({
        where: { userId: id },
        data: {
          ...(data.companyName !== undefined ? { company: data.companyName } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.expertise !== undefined ? { expertise: parseSkillInput(data.expertise) } : {}),
          ...(data.maxMentees !== undefined ? { maxMentees: data.maxMentees } : {}),
        },
      });
    }

    if (updated.role === "MENTEE" && updated.menteeProfile) {
      await tx.menteeProfile.update({
        where: { userId: id },
        data: {
          ...(data.currentRole !== undefined ? { currentRole: data.currentRole } : {}),
          ...(data.goals !== undefined ? { goals: data.goals } : {}),
          ...(data.desiredSkills !== undefined
            ? { desiredSkills: parseSkillInput(data.desiredSkills) }
            : {}),
        },
      });
    }

    return updated;
  });

  await logAudit({
    userId: session.user.id,
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    ipAddress: getClientIp(request),
    metadata: { fields: Object.keys(data) },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return error;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot delete super admin" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id },
    data: { status: "DELETED" },
  });

  await logAudit({
    userId: session.user.id,
    action: "USER_DELETED",
    entity: "User",
    entityId: id,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
