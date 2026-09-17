"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedComposer } from "./FeedComposer";
import { FeedPostCard } from "./FeedPostCard";
import type { FeedPostItem, ReactionType } from "./types";

type FilterTab = "ALL" | "MINE" | "IMAGE" | "VIDEO" | "PODCAST";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "MINE", label: "My posts" },
  { id: "IMAGE", label: "Photos" },
  { id: "VIDEO", label: "Videos" },
  { id: "PODCAST", label: "Podcasts" },
];

export function FeedTimeline({
  authorId,
  currentUserId,
  authorName,
  authorAvatar,
}: {
  authorId?: string;
  currentUserId?: string;
  authorName?: string;
  authorAvatar?: string | null;
}) {
  const [posts, setPosts] = useState<FeedPostItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<FilterTab>("ALL");

  useEffect(() => {
    fetch("/api/feed/bookmarks")
      .then((r) => r.json())
      .then((d) => setSavedIds(new Set(d.postIds ?? [])))
      .catch(() => {});
  }, []);

  const load = useCallback(
    async (next?: string | null, append = false, activeTab: FilterTab = tab) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const params = new URLSearchParams({ take: "15" });
      if (next) params.set("cursor", next);

      const filterAuthor =
        authorId ||
        (activeTab === "MINE" && currentUserId ? currentUserId : undefined);
      if (filterAuthor) params.set("authorId", filterAuthor);
      if (activeTab === "IMAGE" || activeTab === "VIDEO" || activeTab === "PODCAST") {
        params.set("type", activeTab);
      }

      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      if (res.ok) {
        setPosts((prev) => (append ? [...prev, ...data.posts] : data.posts));
        setCursor(data.nextCursor);
      }
      setLoading(false);
      setLoadingMore(false);
    },
    [authorId, currentUserId, tab]
  );

  useEffect(() => {
    load(null, false, tab);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateReaction(
    id: string,
    patch: {
      myReaction: ReactionType | null;
      reactionCounts: FeedPostItem["reactionCounts"];
      likeCount: number;
    }
  ) {
    setPosts((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              myReaction: patch.myReaction,
              reactionCounts: patch.reactionCounts,
              likeCount: patch.likeCount,
              likedByMe: patch.myReaction !== null,
            }
          : x
      )
    );
  }

  function toggleSaved(postId: string, saved: boolean) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (saved) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }

  function updatePost(id: string, patch: Partial<FeedPostItem>) {
    setPosts((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  return (
    <div className="space-y-4">
      {!authorId && (
        <FeedComposer
          onCreated={(post) => setPosts((prev) => [post, ...prev])}
          authorName={authorName}
          authorAvatar={authorAvatar}
        />
      )}

      {!authorId && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-primary/8 bg-white p-2 shadow-card">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-primary/5 hover:text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-primary/5" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-primary/8 bg-white p-8 text-center shadow-card">
          <p className="font-medium text-primary">No posts yet</p>
          <p className="mt-1 text-sm text-muted">
            Be the first to share something with the community.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <FeedPostCard
              key={p.id}
              post={p}
              saved={savedIds.has(p.id)}
              onReaction={(id, patch) => updateReaction(id, patch)}
              onCommentCount={(id, count) =>
                setPosts((prev) =>
                  prev.map((x) => (x.id === id ? { ...x, commentCount: count } : x))
                )
              }
              onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
              onSaved={toggleSaved}
              onUpdated={updatePost}
            />
          ))}
        </div>
      )}

      {cursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={() => load(cursor, true)}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
