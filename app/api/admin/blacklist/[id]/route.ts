import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/utils";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requireSuperAdmin();
  if (error || !session) return error;

  await prisma.blacklist.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "BLACKLIST_REMOVED",
    entity: "Blacklist",
    entityId: id,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({ success: true });
}
