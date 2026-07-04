"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StarDimensionInput } from "./StarDimensionInput";

const DIMENSIONS = [
  { key: "goalClarity", label: "Mentee had a clear goal", weight: "30%" },
  { key: "menteePreparation", label: "Mentee prepared beforehand", weight: "25%" },
  { key: "engagement", label: "Actively engaged", weight: "25%" },
  { key: "followThrough", label: "Showed up and did agreed tasks", weight: "20%" },
] as const;

export function MentorRatesMenteeForm({
  sessionId,
  menteeName,
  onSubmitted,
}: {
  sessionId: string;
  menteeName: string;
  onSubmitted: () => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>({
    goalClarity: 0, menteePreparation: 0, engagement: 0, followThrough: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const allFilled = Object.values(scores).every((v) => v > 0);

  async function submit() {
    if (!allFilled) return;
    setSubmitting(true);
    setError("");
    const res = await fetch(`/api/sessions/${sessionId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scores),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to submit rating");
      return;
    }
    onSubmitted();
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-primary">Rate your mentee: {menteeName}</h3>
      <p className="text-sm text-muted">
        Your rating is private and will not be shown to your mentee directly.
      </p>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="space-y-4 rounded-xl border border-primary/8 bg-white p-5">
        {DIMENSIONS.map((d) => (
          <StarDimensionInput
            key={d.key}
            label={d.label}
            weight={d.weight}
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
