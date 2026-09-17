import type { ReactionType } from "@/lib/db/types";

export type { ReactionType };

export const REACTION_TYPES: ReactionType[] = [
  "LIKE",
  "CELEBRATE",
  "SUPPORT",
  "LOVE",
  "INSIGHTFUL",
];

export const REACTION_META: Record<
  ReactionType,
  { label: string; emoji: string }
> = {
  LIKE: { label: "Like", emoji: "👍" },
  CELEBRATE: { label: "Celebrate", emoji: "🎉" },
  SUPPORT: { label: "Support", emoji: "🙌" },
  LOVE: { label: "Love", emoji: "❤️" },
  INSIGHTFUL: { label: "Insightful", emoji: "💡" },
};

export function emptyReactionCounts(): Record<ReactionType, number> {
  return {
    LIKE: 0,
    CELEBRATE: 0,
    SUPPORT: 0,
    LOVE: 0,
    INSIGHTFUL: 0,
  };
}

export function tallyReactions(
  likes: { reaction?: string | null; userId: string }[],
  userId?: string
): {
  reactionCounts: Record<ReactionType, number>;
  myReaction: ReactionType | null;
  likeCount: number;
} {
  const reactionCounts = emptyReactionCounts();
  let myReaction: ReactionType | null = null;
  for (const like of likes) {
    const r = (like.reaction || "LIKE") as ReactionType;
    if (r in reactionCounts) reactionCounts[r] += 1;
    else reactionCounts.LIKE += 1;
    if (userId && like.userId === userId) {
      myReaction = r in reactionCounts ? r : "LIKE";
    }
  }
  return {
    reactionCounts,
    myReaction,
    likeCount: likes.length,
  };
}

export type FeedAuthor = {
  id: string;
  role: string;
  name: string;
  avatar: string | null;
  tier: string;
  headline?: string | null;
};

export type FeedPostItem = {
  id: string;
  type: "POST" | "PODCAST" | "VIDEO" | "IMAGE";
  title: string;
  body: string | null;
  mediaUrl: string | null;
  mimeType: string | null;
  createdAt: string;
  author: FeedAuthor;
  likeCount: number;
  likedByMe: boolean;
  reactionCounts: Record<ReactionType, number>;
  myReaction: ReactionType | null;
  commentCount: number;
  canDelete: boolean;
};

export type FeedCommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: FeedAuthor;
  canDelete: boolean;
};

export function relativeTime(iso: string | Date): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}
