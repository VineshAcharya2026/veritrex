"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarLinkButtons } from "@/components/mentorship/CalendarLinkButtons";
import type { CalendarLinkSet } from "@/lib/calendar/add-links";

const DURATIONS = [30, 45, 60, 90] as const;

type Props = {
  mentorshipId: string;
  disabled?: boolean;
  onScheduled?: () => void;
};

export function ScheduleSessionBlock({ mentorshipId, disabled, onScheduled }: Props) {
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastLinks, setLastLinks] = useState<CalendarLinkSet | null>(null);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);

  async function submit() {
    if (!scheduledLocal) {
      setError("Pick a date and time");
      return;
    }
    setBusy(true);
    setError("");
    setLastLinks(null);

    const body: Record<string, unknown> = {
      scheduledAt: new Date(scheduledLocal).toISOString(),
      durationMinutes,
      timezone: "Asia/Kolkata",
    };
    const url = meetingUrl.trim();
    if (url) body.meetingUrl = url;

    const res = await fetch(`/api/mentorships/${mentorshipId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to schedule");
      return;
    }

    setScheduledLocal("");
    setMeetingUrl("");
    setLastSessionId(data.id as string);
    setLastLinks((data.calendarLinks as CalendarLinkSet) ?? null);
    onScheduled?.();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor={`sched-${mentorshipId}`}>Date & time</Label>
          <Input
            id={`sched-${mentorshipId}`}
            type="datetime-local"
            value={scheduledLocal}
            disabled={disabled || busy}
            onChange={(e) => setScheduledLocal(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`dur-${mentorshipId}`}>Duration</Label>
          <select
            id={`dur-${mentorshipId}`}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={durationMinutes}
            disabled={disabled || busy}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-1">
          <Label htmlFor={`meet-${mentorshipId}`}>Meeting link (optional)</Label>
          <Input
            id={`meet-${mentorshipId}`}
            type="url"
            placeholder="https://meet.google.com/…"
            value={meetingUrl}
            disabled={disabled || busy}
            onChange={(e) => setMeetingUrl(e.target.value)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="accent"
          disabled={disabled || busy}
          onClick={() => void submit()}
        >
          {busy ? "Scheduling…" : "Schedule session"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {lastSessionId && (
        <div className="rounded-lg border border-primary/10 bg-surface/40 p-3 space-y-2">
          <p className="text-sm font-medium text-primary">Add to your calendar</p>
          <p className="text-xs text-muted">
            Both mentor and mentee receive an email with the same links.
          </p>
          <CalendarLinkButtons sessionId={lastSessionId} links={lastLinks} />
        </div>
      )}
    </div>
  );
}
