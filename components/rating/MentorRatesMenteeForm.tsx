"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StarDimensionInput } from "./StarDimensionInput";
import {
  MENTOR_RATES_MENTEE_DIMENSIONS,
  formatWeightPercent,
  type MentorRatesMenteeKey,
} from "@/lib/rating-questionnaire";

function formatApiError(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  return fallback;
}

export function MentorRatesMenteeForm({
  sessionId,
  menteeName,
  onSubmitted,
}: {
  sessionId: string;
  menteeName: string;
  onSubmitted: () => void;
}) {
  const [scores, setScores] = useState(
    () =>
      Object.fromEntries(
        MENTOR_RATES_MENTEE_DIMENSIONS.map((d) => [d.key, 0])
      ) as Record<MentorRatesMenteeKey, number>
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
      <h3 className="font-semibold text-primary">Rate your mentee: {menteeName}</h3>
      <p className="text-sm text-muted">
        Six weighted questions. Your answers are private and will not be shown to your mentee
        directly — only your TrustScore tier is public.
      </p>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="space-y-4 rounded-xl border border-primary/8 bg-white p-5">
        {MENTOR_RATES_MENTEE_DIMENSIONS.map((d) => (
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
