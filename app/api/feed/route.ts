import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardCreditsAndRecalculate, CREDIT_AMOUNTS } from "@/lib/credits";
import { recalculateThoughtLeadershipScore } from "@/lib/mentor-scores";
import { emptyReactionCounts, tallyReactions } from "@/components/feed/types";

const createSchema = z
  .object({
    type: z.enum(["POST", "PODCAST", "VIDEO", "IMAGE"]),
    title: z.string().max(200).optional(),
    body: z.string().max(5000).optional(),
    mediaUrl: z.string().min(1).optional(),
    storageKey: z.string().optional(),
    mimeType: z.string().optional(),
    fileSize: z.number().int().positive().optional(),
  })
  .refine((d) => Boolean(d.body?.trim()) || Boolean(d.mediaUrl), {
    message: "Provide text body or media",
  });

function resolvePostTitle(data: {
  title?: string;
  body?: string;
  type: string;
  mediaUrl?: string;
}): string {
  const explicit = data.title?.trim();
  if (explicit) return explicit.slice(0, 200);

  const firstLine = data.body
    ?.trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find(Boolean);
  if (firstLine) return firstLine.slice(0, 200);

  if (data.type === "IMAGE") return "Photo";
  if (data.type === "VIDEO") return "Video";
  if (data.type === "PODCAST") return "Podcast";
  return "Update";
}

function serializeAuthor(user: {
  id: string;
  role: string;
  profile: { firstName: string; lastName: string; avatar: string | null } | null;
  trustScore: { tier: string } | null;
  mentorProfile?: { professionalHeadline?: string | null; title?: string | null } | null;
  menteeProfile?: { currentDesignation?: string | null; currentRole?: string | null } | null;
}) {
  const headline =
    user.mentorProfile?.professionalHeadline ||
    user.mentorProfile?.title ||
    user.menteeProfile?.currentDesignation ||
    user.menteeProfile?.currentRole ||
    null;
  return {
    id: user.id,
    role: user.role,
    name: user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : "Member",
    avatar: user.profile?.avatar ?? null,
    tier: user.trustScore?.tier ?? "EMERGING",
    headline,
  };
}

const authorInclude = {
  profile: { select: { firstName: true, lastName: true, avatar: true } },
  trustScore: { select: { tier: true } },
  mentorProfile: { select: { professionalHeadline: true, title: true } },
  menteeProfile: { select: { currentDesignation: true, currentRole: true } },
};

export async function GET(request: Request) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get("take") || 20), 50);
  const cursor = url.searchParams.get("cursor");
  const authorId = url.searchParams.get("authorId");
  const type = url.searchParams.get("type");

  const posts = await prisma.feedPost.findMany({
    where: {
      ...(authorId ? { authorId } : {}),
      ...(type && ["POST", "IMAGE", "VIDEO", "PODCAST"].includes(type)
        ? { type }
        : {}),
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    include: {
      author: { include: authorInclude },
      likes: { select: { userId: true, reaction: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
  });

  const hasMore = posts.length > take;
  const page = hasMore ? posts.slice(0, take) : posts;

  return NextResponse.json({
    posts: page.map((p: any) => {
      const { reactionCounts, myReaction, likeCount } = tallyReactions(
        p.likes,
        session.user.id
      );
      return {
        id: p.id,
        type: p.type,
        title: p.title,
        body: p.body,
        mediaUrl: p.mediaUrl,
        mimeType: p.mimeType,
        createdAt: p.createdAt,
        author: serializeAuthor(p.author),
        likeCount,
        likedByMe: myReaction !== null,
        reactionCounts,
        myReaction,
        commentCount: p._count?.comments ?? 0,
        canDelete:
          p.authorId === session.user.id || session.user.role === "SUPER_ADMIN",
      };
    }),
    nextCursor: hasMore
      ? new Date(page[page.length - 1].createdAt).toISOString()
      : null,
  });
}

export async function POST(request: Request) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const title = resolvePostTitle(data);
  const post = await prisma.feedPost.create({
    data: {
      authorId: session.user.id,
      type: data.type,
      title,
      body: data.body?.trim() || null,
      mediaUrl: data.mediaUrl || null,
      storageKey: data.storageKey || null,
      mimeType: data.mimeType || null,
      fileSize: data.fileSize ?? null,
    },
    include: {
      author: { include: authorInclude },
    },
  });

  if (session.user.role === "MENTOR" && data.mediaUrl) {
    try {
      await awardCreditsAndRecalculate(
        session.user.id,
        CREDIT_AMOUNTS.CONTENT_PUBLISHED,
        "CONTENT_PUBLISHED",
        `Published feed ${data.type.toLowerCase()}: ${title}`
      );
      await recalculateThoughtLeadershipScore(session.user.id);
    } catch {
      // non-blocking
    }
  }

  return NextResponse.json(
    {
      id: post.id,
      type: post.type,
      title: post.title,
      body: post.body,
      mediaUrl: post.mediaUrl,
      mimeType: post.mimeType,
      createdAt: post.createdAt,
      author: serializeAuthor(post.author),
      likeCount: 0,
      likedByMe: false,
      reactionCounts: emptyReactionCounts(),
      myReaction: null,
      commentCount: 0,
      canDelete: true,
    },
    { status: 201 }
  );
}
