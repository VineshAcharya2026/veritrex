import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage";
import { zodErrorMessage } from "@/lib/api-errors";

const patchSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const post = await prisma.feedPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.authorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error.flatten()) }, { status: 400 });
  }

  const data = parsed.data;
  const updated = await prisma.feedPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() || post.title } : {}),
      ...(data.body !== undefined ? { body: data.body.trim() || null } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    body: updated.body,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const post = await prisma.feedPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.authorId !== session.user.id && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (post.storageKey) {
    await deleteStoredFile(post.storageKey);
  }

  await prisma.feedBookmark.deleteMany({ where: { postId: id } });
  await prisma.feedLike.deleteMany({ where: { postId: id } });
  await prisma.feedComment.deleteMany({ where: { postId: id } });
  await prisma.feedPost.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
