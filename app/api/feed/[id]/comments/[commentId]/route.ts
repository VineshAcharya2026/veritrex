import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE", "SUPER_ADMIN"]);
  if (error || !session) return error;

  const { id, commentId } = await params;
  const comment = await prisma.feedComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.postId !== id) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.authorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.feedComment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
