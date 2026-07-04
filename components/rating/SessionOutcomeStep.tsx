"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, Ban } from "lucide-react";

const OUTCOMES = [
  { value: "COMPLETED", label: "Session completed normally", icon: CheckCircle, color: "text-green-600" },
  { value: "MENTOR_NO_SHOW", label: "Mentor didn't show up", icon: XCircle, color: "text-red-500" },
  { value: "MENTEE_NO_SHOW", label: "Mentee didn't show up", icon: XCircle, color: "text-red-500" },
  { value: "MUTUAL_CANCEL", label: "Both agreed to cancel (4+ hrs notice)", icon: Ban, color: "text-gray-500" },
] as const;

export function SessionOutcomeStep({
  sessionId,
  onOutcomeLogged,
}: {
  sessionId: string;
  onOutcomeLogged: (outcome: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/sessions/${sessionId}/outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: selected }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to log outcome");
      return;
    }
    onOutcomeLogged(selected);
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-primary">What happened in this session?</h3>
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
