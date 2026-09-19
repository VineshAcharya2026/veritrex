"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { CheckCircle, XCircle, Ban, Clock } from "lucide-react";

const OUTCOMES = [
  { value: "COMPLETED", label: "Session completed normally", icon: CheckCircle, color: "text-green-600" },
  { value: "MENTOR_NO_SHOW", label: "Mentor didn't show up", icon: XCircle, color: "text-red-500" },
  { value: "MENTEE_NO_SHOW", label: "Mentee didn't show up", icon: XCircle, color: "text-red-500" },
  { value: "MUTUAL_CANCEL", label: "Both agreed to cancel (4+ hrs notice)", icon: Ban, color: "text-gray-500" },
  { value: "LATE_CANCEL", label: "Cancelled with less than 4 hrs notice", icon: Clock, color: "text-amber-600" },
] as const;

export function SessionOutcomeStep({
  sessionId,
  onOutcomeLogged,
}: {
  sessionId: string;
  onOutcomeLogged: (outcome: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    const body: { outcome: string; durationMinutes?: number } = { outcome: selected };
    if (selected === "COMPLETED") {
      const mins = parseInt(durationMinutes, 10);
      if (!Number.isFinite(mins) || mins < 15) {
        setError("Enter session duration (minimum 15 minutes)");
        setSubmitting(false);
        return;
      }
      body.durationMinutes = mins;
    }
    try {
      const res = await fetch(`/api/sessions/${sessionId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let data: { error?: unknown; outcome?: string } = {};
      if (text) {
        try {
          data = JSON.parse(text) as { error?: unknown; outcome?: string };
        } catch {
          data = {};
        }
      }
      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : `Failed to log outcome (${res.status})`
        );
        return;
      }
      onOutcomeLogged(data.outcome ?? selected);
    } catch {
      setError("Network error — could not log outcome");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-primary">What happened in this session?</h3>
      <p className="text-sm text-muted">
        Rating only opens if the session completed normally. No-shows and cancellations are
        tracked as reliability strikes, separate from star ratings.
      </p>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid gap-2 sm:grid-cols-2">
        {OUTCOMES.map((o) => {
          const Icon = o.icon;
          const active = selected === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setSelected(o.value)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-accent bg-accent/5"
                  : "border-primary/10 hover:border-accent/30"
              }`}
            >
              <Icon className={`h-5 w-5 ${o.color}`} />
              <span className="text-sm font-medium text-primary">{o.label}</span>
            </button>
          );
        })}
      </div>
      {selected === "COMPLETED" && (
        <div className="space-y-2">
          <Label htmlFor="duration">Session duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min={15}
            max={240}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </div>
      )}
      <Button
        variant="accent"
        onClick={submit}
        disabled={!selected || submitting}
      >
        {submitting ? "Submitting..." : "Continue"}
      </Button>
    </div>
  );
}
