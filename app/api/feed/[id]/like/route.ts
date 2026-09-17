import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ReactionType } from "@/lib/db/types";
import { emptyReactionCounts, REACTION_TYPES } from "@/components/feed/types";

const schema = z.object({
  type: z.enum(["LIKE", "CELEBRATE", "SUPPORT", "LOVE", "INSIGHTFUL"]).optional(),
});

async function reactionSummary(postId: string, userId: string) {
  const likes = await prisma.feedLike.findMany({
    where: { postId },
    select: { userId: true, reaction: true },
  });
  const reactionCounts = emptyReactionCounts();
  let myReaction: ReactionType | null = null;
  for (const like of likes) {
    const r = (like.reaction || "LIKE") as ReactionType;
    if (REACTION_TYPES.includes(r)) reactionCounts[r] += 1;
    else reactionCounts.LIKE += 1;
    if (like.userId === userId) {
      myReaction = REACTION_TYPES.includes(r) ? r : "LIKE";
    }
  }
  return {
    myReaction,
    reactionCounts,
    total: likes.length,
    liked: myReaction !== null,
    likeCount: likes.length,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const { id } = await params;
  const post = await prisma.feedPost.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  let reaction: ReactionType = "LIKE";
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (parsed.success && parsed.data.type) reaction = parsed.data.type;
  } catch {
    // empty body → LIKE
  }

  const existing = await prisma.feedLike.findFirst({
    where: { postId: id, userId: session.user.id },
  });

  if (existing) {
    if (existing.reaction === reaction) {
      return NextResponse.json(await reactionSummary(id, session.user.id));
    }
    await prisma.feedLike.update({
      where: { id: existing.id },
      data: { reaction },
    });
  } else {
    await prisma.feedLike.create({
      data: { postId: id, userId: session.user.id, reaction },
    });
  }

  return NextResponse.json(await reactionSummary(id, session.user.id));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const { id } = await params;
  await prisma.feedLike.deleteMany({
    where: { postId: id, userId: session.user.id },
  });
  return NextResponse.json(await reactionSummary(id, session.user.id));
}
