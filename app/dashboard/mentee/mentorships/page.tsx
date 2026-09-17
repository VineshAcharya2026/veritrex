"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SessionRow = {
  id: string;
  scheduledAt: string;
  outcome: string | null;
  ratings?: { raterId: string }[];
};

type Mentorship = {
  id: string;
  status: string;
  mentor: {
    id: string;
    email: string;
    profile?: { firstName: string; lastName: string } | null;
    mentorProfile?: { title?: string | null; company?: string | null } | null;
  };
};

export default function MenteeMentorshipsPage() {
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [sessionsByMentorship, setSessionsByMentorship] = useState<Record<string, SessionRow[]>>({});
  const [scheduleAt, setScheduleAt] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadSessions(mentorshipId: string) {
    const res = await fetch(`/api/mentorships/${mentorshipId}/sessions`);
    const data = await res.json();
    if (res.ok && Array.isArray(data)) {
      setSessionsByMentorship((prev) => ({ ...prev, [mentorshipId]: data }));
    }
  }

  const load = () =>
    fetch("/api/mentee/mentorships")
      .then((r) => r.json())
      .then(async (data) => {
        const list = Array.isArray(data) ? data : [];
        setMentorships(list);
        await Promise.all(
          list.filter((m: Mentorship) => m.status === "ACTIVE").map((m: Mentorship) => loadSessions(m.id))
        );
      });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserId(d?.user?.id ?? null))
      .catch(() => {});
    load();
  }, []);

  async function scheduleSession(mentorshipId: string) {
    const local = scheduleAt[mentorshipId];
    if (!local) {
      setMessage("Pick a date and time first");
      return;
    }
    setBusyId(mentorshipId);
    setMessage("");
    const res = await fetch(`/api/mentorships/${mentorshipId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: new Date(local).toISOString() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Failed to schedule");
      return;
    }
    setMessage("Session scheduled");
    setScheduleAt((prev) => ({ ...prev, [mentorshipId]: "" }));
    await loadSessions(mentorshipId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My mentorships"
        description="See your mentors, schedule sessions, and leave feedback after each one."
      />
      {message && <Alert variant="info">{message}</Alert>}

      <div className="space-y-3">
        {mentorships.length === 0 ? (
          <Alert variant="info">
            No mentorships yet.{" "}
            <Link href="/dashboard/mentee/mentors" className="text-accent hover:underline">
              Find a mentor
            </Link>
          </Alert>
        ) : (
          mentorships.map((m) => {
            const name = m.mentor.profile
              ? `${m.mentor.profile.firstName} ${m.mentor.profile.lastName}`
              : m.mentor.email;
            const sessions = sessionsByMentorship[m.id] ?? [];
            const now = Date.now();
            const upcoming = sessions.filter((s) => new Date(s.scheduledAt).getTime() >= now);
            const past = sessions.filter((s) => new Date(s.scheduledAt).getTime() < now);

            return (
              <div key={m.id} className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-primary">{name}</h3>
                    <p className="text-sm text-muted">
                      {[m.mentor.mentorProfile?.title, m.mentor.mentorProfile?.company]
                        .filter(Boolean)
                        .join(" · ") || m.mentor.email}
                    </p>
                  </div>
                  <Badge variant="accent">{m.status}</Badge>
                </div>

                {m.status === "ACTIVE" && (
                  <div className="space-y-3 border-t border-primary/5 pt-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`msched-${m.id}`}>Schedule session</Label>
                        <Input
                          id={`msched-${m.id}`}
                          type="datetime-local"
                          value={scheduleAt[m.id] || ""}
                          onChange={(e) =>
                            setScheduleAt((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="accent"
                        disabled={busyId === m.id}
                        onClick={() => scheduleSession(m.id)}
                      >
                        {busyId === m.id ? "Scheduling..." : "Schedule"}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/mentor/${m.mentor.id}`}>View profile</Link>
                      </Button>
                    </div>

                    {upcoming.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">Upcoming</p>
                        {upcoming.map((s) => (
                          <div
                            key={s.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/8 px-3 py-2 text-sm"
                          >
                            <span>{new Date(s.scheduledAt).toLocaleString()}</span>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/dashboard/session/${s.id}/rate`}>
                                {s.outcome ? "Rate" : "Log outcome"}
                              </Link>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {past.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">Past</p>
                        {past.map((s) => {
                          const alreadyRated =
                            !!userId && s.ratings?.some((r) => r.raterId === userId);
                          const needsFeedback =
                            !s.outcome ||
                            (s.outcome === "COMPLETED" && !alreadyRated);
                          return (
                            <div
                              key={s.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/8 px-3 py-2 text-sm"
                            >
                              <span>
                                {new Date(s.scheduledAt).toLocaleString()}
                                <span className="ml-2 text-xs text-muted">
                                  {s.outcome ?? "Awaiting feedback"}
                                  {alreadyRated ? " · Rated" : ""}
                                </span>
                              </span>
                              {needsFeedback && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/dashboard/session/${s.id}/rate`}>
                                    {s.outcome ? "Rate" : "Log outcome"}
                                  </Link>
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
