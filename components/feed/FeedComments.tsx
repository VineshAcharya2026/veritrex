"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { relativeTime, type FeedCommentItem } from "./types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FeedComments({
  postId,
  open,
  onCountChange,
}: {
  postId: string;
  open: boolean;
  onCountChange: (count: number) => void;
}) {
  const [comments, setComments] = useState<FeedCommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    fetch(`/api/feed/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.comments ?? [];
        setComments(list);
        onCountChange(list.length);
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [open, loaded, postId, onCountChange]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setComments((prev) => {
        const next = [...prev, data as FeedCommentItem];
        onCountChange(next.length);
        return next;
      });
      setBody("");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(commentId: string) {
    const res = await fetch(`/api/feed/${postId}/comments/${commentId}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== commentId);
      onCountChange(next.length);
      return next;
    });
  }

  if (!open) return null;

  return (
    <div className="mt-3 space-y-3 border-t border-primary/5 pt-3">
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          maxLength={2000}
          className="h-10 flex-1 rounded-full border border-primary/15 bg-primary/[0.02] px-4 text-sm outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
        />
        <Button type="submit" size="sm" variant="accent" disabled={submitting || !body.trim()}>
          {submitting ? "..." : "Post"}
        </Button>
      </form>

      {loading ? (
        <div className="h-12 animate-pulse rounded-lg bg-primary/5" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const href =
              c.author.role === "MENTOR"
                ? `/mentor/${c.author.id}`
                : c.author.role === "MENTEE"
                  ? `/mentee/${c.author.id}`
                  : "#";
            return (
              <li key={c.id} className="flex gap-2">
                <Link
                  href={href}
                  className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
                >
                  {c.author.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.author.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(c.author.name)
                  )}
                </Link>
                <div className="min-w-0 flex-1 rounded-lg bg-primary/[0.03] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link href={href} className="text-sm font-semibold text-primary hover:underline">
                      {c.author.name}
                    </Link>
                    <span className="text-[11px] text-muted">{relativeTime(c.createdAt)}</span>
                    {c.canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        className="ml-auto text-muted hover:text-red-600"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-primary/90">{c.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
