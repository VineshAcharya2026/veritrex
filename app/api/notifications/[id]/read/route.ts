import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const notification = await prisma.notification.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json(updated);
}
