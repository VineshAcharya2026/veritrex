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
  ratings: { raterId: string }[];
};

type Mentorship = {
  id: string;
  status: string;
  message?: string;
  mentee: {
    id?: string;
    email: string;
    profile?: { firstName: string; lastName: string };
    menteeProfile?: { currentRole?: string; goals?: string; desiredSkills: string[] };
  };
};

export default function MentorMenteesPage() {
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
    fetch("/api/mentor/mentees")
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

  async function updateStatus(id: string, status: "ACTIVE" | "REJECTED") {
    await fetch(`/api/mentor/mentorships/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function scheduleSession(mentorshipId: string) {
    const local = scheduleAt[mentorshipId];
    if (!local) {
      setMessage("Pick a date and time first");
      return;
    }
    setBusyId(mentorshipId);
    setMessage("");
    const iso = new Date(local).toISOString();
    const res = await fetch(`/api/mentorships/${mentorshipId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: iso }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setMessage(typeof data.error === "string" ? data.error : "Failed to schedule session");
      return;
    }
    setMessage("Session scheduled");
    setScheduleAt((prev) => ({ ...prev, [mentorshipId]: "" }));
    await loadSessions(mentorshipId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My mentees"
        description="Review requests, schedule sessions, and open feedback when a session ends."
      />

      {message && <Alert variant="info">{message}</Alert>}

      <div className="space-y-3">
        {mentorships.length === 0 ? (
          <Alert variant="info">No mentorship requests yet.</Alert>
        ) : (
          mentorships.map((m) => {
            const name = m.mentee.profile
              ? `${m.mentee.profile.firstName} ${m.mentee.profile.lastName}`
              : m.mentee.email;
            const sessions = sessionsByMentorship[m.id] ?? [];
            return (
              <div key={m.id} className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-primary">{name}</h3>
                    <p className="text-sm text-muted">{m.mentee.email}</p>
                    {m.mentee.menteeProfile?.currentRole && (
                      <p className="mt-1 text-sm">Role: {m.mentee.menteeProfile.currentRole}</p>
                    )}
                    {m.mentee.menteeProfile?.goals && (
                      <p className="mt-1 text-sm text-muted">Goals: {m.mentee.menteeProfile.goals}</p>
                    )}
                    {m.message && <p className="mt-2 text-sm italic">&ldquo;{m.message}&rdquo;</p>}
                  </div>
                  <Badge variant="accent">{m.status}</Badge>
                </div>

                {m.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="accent" onClick={() => updateStatus(m.id, "ACTIVE")}>
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(m.id, "REJECTED")}>
                      Decline
                    </Button>
                  </div>
                )}

                {m.status === "ACTIVE" && (
                  <div className="space-y-3 border-t border-primary/5 pt-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`sched-${m.id}`}>Schedule session</Label>
                        <Input
                          id={`sched-${m.id}`}
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
                    </div>

                    {sessions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Sessions
                        </p>
                        {sessions.map((s) => {
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
                                  {s.outcome ?? "No outcome yet"}
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
