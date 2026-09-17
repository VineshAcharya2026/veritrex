"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  MessageCircle,
  Pencil,
  Share2,
  Trash2,
  MoreHorizontal,
  X,
} from "lucide-react";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReactionPicker } from "./ReactionPicker";
import { FeedComments } from "./FeedComments";
import { renderFeedBody } from "@/lib/feed-body";
import { formatApiError } from "@/lib/api-errors";
import {
  REACTION_META,
  REACTION_TYPES,
  relativeTime,
  type FeedPostItem,
  type ReactionType,
} from "./types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type FriendMatch = {
  user: { userId: string; profile?: { firstName: string; lastName: string } | null };
};

export function FeedPostCard({
  post,
  saved = false,
  onReaction,
  onCommentCount,
  onDeleted,
  onSaved,
  onUpdated,
}: {
  post: FeedPostItem;
  saved?: boolean;
  onReaction: (
    id: string,
    patch: {
      myReaction: ReactionType | null;
      reactionCounts: FeedPostItem["reactionCounts"];
      likeCount: number;
    }
  ) => void;
  onCommentCount: (id: string, count: number) => void;
  onDeleted: (id: string) => void;
  onSaved?: (id: string, saved: boolean) => void;
  onUpdated?: (id: string, patch: Partial<FeedPostItem>) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body || "");
  const [editTitle, setEditTitle] = useState(post.title);
  const [editError, setEditError] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [friends, setFriends] = useState<FriendMatch[]>([]);
  const [shareMessage, setShareMessage] = useState("");
  const [shareStatus, setShareStatus] = useState("");

  useEffect(() => {
    setIsSaved(saved);
  }, [saved]);

  const profileHref =
    post.author.role === "MENTOR"
      ? `/mentor/${post.author.id}`
      : post.author.role === "MENTEE"
        ? `/mentee/${post.author.id}`
        : "#";

  const isVideoPodcast =
    post.type === "PODCAST" && post.mimeType?.startsWith("video/");

  async function applyReaction(type: ReactionType | null) {
    if (type === null || (post.myReaction === type && type === "LIKE")) {
      const res = await fetch(`/api/feed/${post.id}/like`, { method: "DELETE" });
      if (!res.ok) return;
      const data = await res.json();
      onReaction(post.id, {
        myReaction: data.myReaction,
        reactionCounts: data.reactionCounts,
        likeCount: data.total ?? data.likeCount,
      });
      return;
    }

    if (post.myReaction === type) {
      const res = await fetch(`/api/feed/${post.id}/like`, { method: "DELETE" });
      if (!res.ok) return;
      const data = await res.json();
      onReaction(post.id, {
        myReaction: data.myReaction,
        reactionCounts: data.reactionCounts,
        likeCount: data.total ?? data.likeCount,
      });
      return;
    }

    const res = await fetch(`/api/feed/${post.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) return;
    const data = await res.json();
    onReaction(post.id, {
      myReaction: data.myReaction,
      reactionCounts: data.reactionCounts,
      likeCount: data.total ?? data.likeCount,
    });
  }

  async function remove() {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/feed/${post.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(post.id);
  }

  async function copyLink() {
    const url = `${window.location.origin}/dashboard/feed`;
    try {
      await navigator.clipboard.writeText(`${url}#post-${post.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function toggleSave() {
    const next = !isSaved;
    const res = await fetch(
      next ? "/api/feed/bookmarks" : `/api/feed/bookmarks?postId=${post.id}`,
      next
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: post.id }),
          }
        : { method: "DELETE" }
    );
    if (!res.ok) return;
    setIsSaved(next);
    onSaved?.(post.id, next);
  }

  async function saveEdit() {
    setEditError("");
    const res = await fetch(`/api/feed/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, body: editBody }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEditError(formatApiError(data.error, "Failed to save edits"));
      return;
    }
    onUpdated?.(post.id, { title: data.title, body: data.body });
    setEditing(false);
    setMenuOpen(false);
  }

  async function openShare() {
    setShareOpen(true);
    setShareMessage("");
    setShareStatus("");
    if (friends.length === 0) {
      const res = await fetch("/api/friends");
      const data = await res.json();
      setFriends(data.matches ?? []);
    }
  }

  async function shareWithFriend(recipientId: string) {
    const link = `${window.location.origin}/dashboard/feed#post-${post.id}`;
    const body = shareMessage.trim()
      ? `${shareMessage.trim()}\n\n${link}`
      : `Check out this post on Veritrex: ${post.title}\n${link}`;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, body }),
    });
    if (res.ok) {
      setShareStatus("Shared!");
      setTimeout(() => setShareOpen(false), 800);
    } else {
      const data = await res.json();
      setShareStatus(formatApiError(data.error, "Share failed"));
    }
  }

  const activeReactions = REACTION_TYPES.filter(
    (t) => (post.reactionCounts?.[t] ?? 0) > 0
  );

  return (
    <article id={`post-${post.id}`} className="rounded-xl border border-primary/8 bg-white shadow-card">
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3">
          <Link
            href={profileHref}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            {post.author.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.author.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(post.author.name)
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={profileHref} className="font-semibold text-primary hover:underline">
                {post.author.name}
              </Link>
              <TrustScoreBadge tier={post.author.tier} />
            </div>
            {post.author.headline && (
              <p className="truncate text-xs text-muted">{post.author.headline}</p>
            )}
            <p className="text-xs text-muted">
              {relativeTime(post.createdAt)}
              <span className="mx-1">·</span>
              {post.author.role.charAt(0) + post.author.role.slice(1).toLowerCase()}
              <span className="mx-1">·</span>
              {post.type.charAt(0) + post.type.slice(1).toLowerCase()}
            </p>
          </div>
          {(post.canDelete || isSaved) && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Post options"
              >
                <MoreHorizontal className="h-4 w-4 text-muted" />
              </Button>
              {menuOpen && (
                <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-primary/10 bg-white py-1 shadow-card-hover">
                  {post.canDelete && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-primary/5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={remove}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-3 space-y-2">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-md border border-primary/15 px-3 py-2 text-sm"
            />
            <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} />
            {editError && <p className="text-xs text-red-600">{editError}</p>}
            <div className="flex gap-2">
              <Button size="sm" variant="accent" onClick={saveEdit}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="mt-3 text-base font-semibold text-primary">{post.title}</h3>
            {post.body && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-primary/90">
                {renderFeedBody(post.body)}
              </p>
            )}
          </>
        )}
      </div>

      {post.mediaUrl && post.type === "IMAGE" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.mediaUrl}
          alt={post.title}
          className="mt-3 max-h-[480px] w-full object-cover"
        />
      )}
      {post.mediaUrl && post.type === "VIDEO" && (
        <video src={post.mediaUrl} controls className="mt-3 max-h-[480px] w-full bg-black" />
      )}
      {post.mediaUrl && post.type === "PODCAST" && isVideoPodcast && (
        <video src={post.mediaUrl} controls className="mt-3 max-h-[480px] w-full bg-black" />
      )}
      {post.mediaUrl && post.type === "PODCAST" && !isVideoPodcast && (
        <div className="px-4 pt-3">
          <audio src={post.mediaUrl} controls className="w-full" />
        </div>
      )}
      {post.mediaUrl && post.type === "POST" && (
        <div className="px-4 pt-3">
          <a
            href={post.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline"
          >
            View attachment
          </a>
        </div>
      )}

      <div className="px-4 pt-3">
        {(post.likeCount > 0 || post.commentCount > 0) && (
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-1">
              {activeReactions.length > 0 && (
                <>
                  <span className="flex -space-x-1">
                    {activeReactions.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-primary/[0.04] text-[11px]"
                      >
                        {REACTION_META[t].emoji}
                      </span>
                    ))}
                  </span>
                  <span>{post.likeCount}</span>
                </>
              )}
            </div>
            {post.commentCount > 0 && (
              <button
                type="button"
                onClick={() => setShowComments(true)}
                className="hover:text-primary hover:underline"
              >
                {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-around border-t border-primary/5 py-1">
          <ReactionPicker
            myReaction={post.myReaction}
            onSelect={(type) => applyReaction(type)}
            onToggle={() => applyReaction(post.myReaction ? null : "LIKE")}
          />
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-primary/5 hover:text-primary"
          >
            <MessageCircle className="h-4 w-4" />
            Comment
          </button>
          <button
            type="button"
            onClick={toggleSave}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/5 ${
              isSaved ? "text-accent" : "text-muted hover:text-primary"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={openShare}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-primary/5 hover:text-primary"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        <FeedComments
          postId={post.id}
          open={showComments}
          onCountChange={(count) => onCommentCount(post.id, count)}
        />
      </div>

      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-primary">Share with a friend</h3>
              <button type="button" onClick={() => setShareOpen(false)} aria-label="Close">
                <X className="h-4 w-4 text-muted" />
              </button>
            </div>
            <Textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Add a note (optional)"
              rows={2}
              className="mb-3"
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {friends.length === 0 ? (
                <p className="text-sm text-muted">No friends to share with yet.</p>
              ) : (
                friends.map((m) => {
                  const name = m.user.profile
                    ? `${m.user.profile.firstName} ${m.user.profile.lastName}`
                    : "Member";
                  return (
                    <button
                      key={m.user.userId}
                      type="button"
                      onClick={() => shareWithFriend(m.user.userId)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-primary/5"
                    >
                      <span>{name}</span>
                      <Share2 className="h-3.5 w-3.5 text-accent" />
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? "Link copied" : "Copy link"}
              </Button>
              {shareStatus && <span className="text-xs text-muted">{shareStatus}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="h-2" />
    </article>
  );
}
