import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tallyReactions } from "@/components/feed/types";
import type { FeedPostItem } from "@/components/feed/types";
import { RecentPostsClient } from "@/components/feed/RecentPostsClient";

const authorInclude = {
  profile: { select: { firstName: true, lastName: true, avatar: true } },
  trustScore: { select: { tier: true } },
  mentorProfile: { select: { professionalHeadline: true, title: true } },
  menteeProfile: { select: { currentDesignation: true, currentRole: true } },
};

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

export async function RecentPostsSection({
  authorId,
  hideHeader = false,
}: {
  authorId: string;
  hideHeader?: boolean;
}) {
  const session = await getSession();
  const viewerId = session?.user?.id;

  const posts = await prisma.feedPost.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      author: { include: authorInclude },
      likes: { select: { userId: true, reaction: true } },
      _count: { select: { comments: true } },
    },
  });

  const initialPosts: FeedPostItem[] = posts.map((p: any) => {
    const { reactionCounts, myReaction, likeCount } = tallyReactions(
      p.likes,
      viewerId
    );
    return {
      id: p.id,
      type: p.type,
      title: p.title,
      body: p.body,
      mediaUrl: p.mediaUrl,
      mimeType: p.mimeType,
      createdAt:
        typeof p.createdAt === "string"
          ? p.createdAt
          : new Date(p.createdAt).toISOString(),
      author: serializeAuthor(p.author),
      likeCount,
      likedByMe: myReaction !== null,
      reactionCounts,
      myReaction,
      commentCount: p._count?.comments ?? 0,
      canDelete:
        Boolean(viewerId) &&
        (p.authorId === viewerId || session?.user?.role === "SUPER_ADMIN"),
    };
  });

  return <RecentPostsClient initialPosts={initialPosts} hideHeader={hideHeader} />;
}
