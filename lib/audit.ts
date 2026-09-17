import { prisma } from "@/lib/prisma";
import type { JsonValue } from "@/lib/db/types";

export async function logAudit(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  metadata?: JsonValue;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      ipAddress: params.ipAddress,
      metadata: params.metadata,
    },
  });
}
