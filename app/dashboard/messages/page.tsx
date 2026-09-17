"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { formatApiError } from "@/lib/api-errors";

type ThreadSummary = {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
};

type MessageItem = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
};

export default function MessagesPage() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => setThreads(d.threads ?? []))
      .catch(() => setError("Failed to load messages"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    fetch(`/api/messages/${activeId}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => setMessages([]));
  }, [activeId]);

  async function send() {
    if (!activeId || !draft.trim()) return;
    const res = await fetch(`/api/messages/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(formatApiError(data.error, "Failed to send"));
      return;
    }
    setMessages((prev) => [...prev, data]);
    setDraft("");
    setError("");
  }

  const activeThread = threads.find((t) => t.id === activeId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Messages"
        description="Lightweight 1:1 conversations with mentors and mentees."
      />
      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid min-h-[420px] gap-4 overflow-hidden rounded-xl border border-primary/8 bg-white shadow-card md:grid-cols-[280px_1fr]">
        <div className="border-b border-primary/8 md:border-b-0 md:border-r">
          {loading ? (
            <p className="p-4 text-sm text-muted">Loading…</p>
          ) : threads.length === 0 ? (
            <div className="p-4 text-sm text-muted">
              No conversations yet. Share a post with a friend or start from{" "}
              <Link href="/dashboard/friends" className="text-accent hover:underline">
                Find Friends
              </Link>
              .
            </div>
          ) : (
            <ul>
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-primary/[0.03] ${
                      activeId === t.id ? "bg-primary/[0.05]" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {t.otherUser.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.otherUser.avatar}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        t.otherUser.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary">
                        {t.otherUser.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {t.lastMessage?.body || "No messages yet"}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col">
          {activeThread ? (
            <>
              <div className="border-b border-primary/8 px-4 py-3">
                <p className="font-semibold text-primary">{activeThread.otherUser.name}</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className="rounded-lg bg-primary/[0.04] px-3 py-2 text-sm">
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-primary/8 p-3">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  rows={2}
                />
                <Button className="mt-2" size="sm" variant="accent" onClick={send}>
                  Send
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
