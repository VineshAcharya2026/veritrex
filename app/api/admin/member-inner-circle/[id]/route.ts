import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.memberReflection.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const reflection = await prisma.memberReflection.update({
    where: { id },
    data: {
      reviewStatus: parsed.data.status,
      reviewedAt: new Date(),
    },
  });

  const message =
    parsed.data.status === "APPROVED"
      ? "Your Inner Circle (Community) application was approved. Welcome to the circle!"
      : "Your Inner Circle (Community) application was not selected at this time. You may revise and resubmit your application.";

  await createNotification(existing.userId, message, NOTIFICATION_TYPES.ACCOUNT);

  return NextResponse.json(reflection);
}
