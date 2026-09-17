"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StarDimensionInput } from "./StarDimensionInput";
import {
  MENTEE_RATES_MENTOR_DIMENSIONS,
  formatWeightPercent,
  type MenteeRatesMentorKey,
} from "@/lib/rating-questionnaire";

function formatApiError(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  return fallback;
}

export function MenteeRatesMentorForm({
  sessionId,
  mentorName,
  onSubmitted,
}: {
  sessionId: string;
  mentorName: string;
  onSubmitted: () => void;
}) {
  const [scores, setScores] = useState(
    () =>
      Object.fromEntries(
        MENTEE_RATES_MENTOR_DIMENSIONS.map((d) => [d.key, 0])
      ) as Record<MenteeRatesMentorKey, number>
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allFilled = Object.values(scores).every((v) => v > 0);

  async function submit() {
    if (!allFilled) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scores),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatApiError(data.error, "Failed to submit rating"));
        return;
      }
      onSubmitted();
    } catch {
      setError("Network error — could not submit rating");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-primary">Rate your mentor: {mentorName}</h3>
      <p className="text-sm text-muted">
        Six weighted questions. Your answers are private and will not be shown to your mentor
        directly — only your TrustScore tier is public.
      </p>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="space-y-4 rounded-xl border border-primary/8 bg-white p-5">
        {MENTEE_RATES_MENTOR_DIMENSIONS.map((d) => (
          <StarDimensionInput
            key={d.key}
            label={d.label}
            weight={formatWeightPercent(d.weight)}
            value={scores[d.key]}
            onChange={(v) => setScores({ ...scores, [d.key]: v })}
          />
        ))}
      </div>
      <Button variant="accent" onClick={submit} disabled={!allFilled || submitting}>
        {submitting ? "Submitting..." : "Submit rating"}
      </Button>
    </div>
  );
}
