import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

function serializeAuthor(user: {
  id: string;
  role: string;
  profile: { firstName: string; lastName: string; avatar: string | null } | null;
  trustScore: { tier: string } | null;
}) {
  return {
    id: user.id,
    role: user.role,
    name: user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : "Member",
    avatar: user.profile?.avatar ?? null,
    tier: user.trustScore?.tier ?? "EMERGING",
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const { id } = await params;
  const post = await prisma.feedPost.findUnique({ where: { id }, select: { id: true } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const comments = await prisma.feedComment.findMany({
    where: { postId: id },
    include: {
      author: {
        include: {
          profile: { select: { firstName: true, lastName: true, avatar: true } },
          trustScore: { select: { tier: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    comments: comments.map((c: any) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: serializeAuthor(c.author),
      canDelete:
        c.authorId === session.user.id || session.user.role === "SUPER_ADMIN",
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const { id } = await params;
  const post = await prisma.feedPost.findUnique({ where: { id }, select: { id: true } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const comment = await prisma.feedComment.create({
    data: {
      postId: id,
      authorId: session.user.id,
      body: parsed.data.body,
    },
    include: {
      author: {
        include: {
          profile: { select: { firstName: true, lastName: true, avatar: true } },
          trustScore: { select: { tier: true } },
        },
      },
    },
  });

  return NextResponse.json(
    {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: serializeAuthor(comment.author),
      canDelete: true,
    },
    { status: 201 }
  );
}
