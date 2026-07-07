import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const item = await prisma.mentorContent.findFirst({
    where: { id, mentor: { userId: session.user.id } },
  });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (item.storageKey) {
    await deleteStoredFile(item.storageKey);
  }

  await prisma.mentorContent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
