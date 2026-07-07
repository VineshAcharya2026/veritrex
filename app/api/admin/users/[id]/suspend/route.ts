import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return error;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cannot suspend super admin" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id },
    data: { status: "SUSPENDED" },
  });

  await logAudit({
    userId: session.user.id,
    action: "USER_SUSPENDED",
    entity: "User",
    entityId: id,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
