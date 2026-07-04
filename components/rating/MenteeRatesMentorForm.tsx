"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StarDimensionInput } from "./StarDimensionInput";

const DIMENSIONS = [
  { key: "knowledge", label: "Knowledge / Advice quality", weight: "30%" },
  { key: "actionability", label: "How useful / actionable", weight: "25%" },
  { key: "preparation", label: "Mentor came prepared", weight: "20%" },
  { key: "clarity", label: "Easy to understand", weight: "15%" },
  { key: "responsiveness", label: "On time / responsive", weight: "10%" },
] as const;

export function MenteeRatesMentorForm({
  sessionId,
  mentorName,
  onSubmitted,
}: {
  sessionId: string;
  mentorName: string;
  onSubmitted: () => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>({
    knowledge: 0, actionability: 0, preparation: 0, clarity: 0, responsiveness: 0,
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
      <h3 className="font-semibold text-primary">Rate your mentor: {mentorName}</h3>
      <p className="text-sm text-muted">
        Your rating is private and will not be shown to your mentor directly.
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
