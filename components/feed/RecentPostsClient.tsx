"use client";

import { useState } from "react";
import Link from "next/link";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import type { FeedPostItem, ReactionType } from "@/components/feed/types";

export function RecentPostsClient({
  initialPosts,
  hideHeader = false,
}: {
  initialPosts: FeedPostItem[];
  hideHeader?: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts);

  function onReaction(
    id: string,
    patch: {
      myReaction: ReactionType | null;
      reactionCounts: FeedPostItem["reactionCounts"];
      likeCount: number;
    }
  ) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              myReaction: patch.myReaction,
              reactionCounts: patch.reactionCounts,
              likeCount: patch.likeCount,
              likedByMe: patch.myReaction !== null,
            }
          : p
      )
    );
  }

  function onCommentCount(id: string, count: number) {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, commentCount: count } : p))
    );
  }

  function onDeleted(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  if (posts.length === 0) {
    return <p className="text-sm text-muted">No recent posts yet.</p>;
  }

  return (
    <div>
      {!hideHeader && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Recent posts</h2>
          <Link href="/dashboard/feed" className="text-sm text-accent hover:underline">
            Open feed
          </Link>
        </div>
      )}
      {hideHeader && (
        <div className="mb-3 flex justify-end">
          <Link href="/dashboard/feed" className="text-sm text-accent hover:underline">
            Open feed
          </Link>
        </div>
      )}
      <div className="space-y-3">
        {posts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            onReaction={onReaction}
            onCommentCount={onCommentCount}
            onDeleted={onDeleted}
          />
        ))}
      </div>
    </div>
  );
}
