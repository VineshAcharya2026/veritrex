import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const bookmarks = await prisma.feedBookmark.findMany({
    where: { userId: session.user.id },
    include: {
      post: {
        include: {
          author: {
            include: {
              profile: { select: { firstName: true, lastName: true, avatar: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    postIds: bookmarks.map((b) => b.postId),
    saved: bookmarks.map((b) => ({
      postId: b.postId,
      savedAt: b.createdAt,
      title: b.post?.title,
    })),
  });
}

export async function POST(request: Request) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const { postId } = (await request.json()) as { postId?: string };
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  const post = await prisma.feedPost.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existing = await prisma.feedBookmark.findFirst({
    where: { postId, userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ saved: true, postId });
  }

  await prisma.feedBookmark.create({
    data: { postId, userId: session.user.id },
  });

  return NextResponse.json({ saved: true, postId }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const url = new URL(request.url);
  const postId = url.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  await prisma.feedBookmark.deleteMany({
    where: { postId, userId: session.user.id },
  });

  return NextResponse.json({ saved: false, postId });
}
