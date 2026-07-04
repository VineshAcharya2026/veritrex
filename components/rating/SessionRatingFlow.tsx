"use client";

import { useEffect, useState } from "react";
import { SessionOutcomeStep } from "./SessionOutcomeStep";
import { MenteeRatesMentorForm } from "./MenteeRatesMentorForm";
import { MentorRatesMenteeForm } from "./MentorRatesMenteeForm";
import { TrustScoreBadge } from "./TrustScoreBadge";
import { Alert } from "@/components/ui/alert";
import { Clock } from "lucide-react";

type SessionInfo = {
  id: string;
  outcome: string | null;
  mentorName: string;
  menteeName: string;
  userRole: "MENTOR" | "MENTEE";
};

type RatingStatus = {
  myRatingSubmitted: boolean;
  otherRatingSubmitted: boolean;
  canReveal: boolean;
  receivedRating: { weightedScore: number; raterRole: string } | null;
};

export function SessionRatingFlow({ session }: { session: SessionInfo }) {
  const [outcome, setOutcome] = useState(session.outcome);
  const [ratingStatus, setRatingStatus] = useState<RatingStatus | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function loadRatingStatus() {
    fetch(`/api/sessions/${session.id}/ratings`)
      .then((r) => r.json())
      .then(setRatingStatus);
  }

  useEffect(() => {
    if (outcome === "COMPLETED") loadRatingStatus();
  }, [outcome, submitted]);

  if (!outcome) {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <SessionOutcomeStep
          sessionId={session.id}
          onOutcomeLogged={(o) => setOutcome(o)}
        />
      </div>
    );
  }

  if (outcome === "MENTOR_NO_SHOW") {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <Alert variant="error">
          Mentor no-show recorded. A strike has been logged and you have been credited.
        </Alert>
      </div>
    );
  }

  if (outcome === "MENTEE_NO_SHOW") {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <Alert variant="error">
          Mentee no-show recorded. A strike has been logged. Mentor has received partial credit.
        </Alert>
      </div>
    );
  }

  if (outcome === "MUTUAL_CANCEL") {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <Alert variant="success">
          Session was mutually cancelled. No rating or penalty applied.
        </Alert>
      </div>
    );
  }

  if (!ratingStatus) {
    return <div className="h-32 animate-pulse rounded-xl bg-primary/5" />;
  }

  if (!ratingStatus.myRatingSubmitted) {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        {session.userRole === "MENTEE" ? (
          <MenteeRatesMentorForm
            sessionId={session.id}
            mentorName={session.mentorName}
            onSubmitted={() => setSubmitted(true)}
          />
        ) : (
          <MentorRatesMenteeForm
            sessionId={session.id}
            menteeName={session.menteeName}
            onSubmitted={() => setSubmitted(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3">
      <Alert variant="success">Your rating has been submitted.</Alert>

      {!ratingStatus.canReveal && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock className="h-4 w-4" />
          {ratingStatus.otherRatingSubmitted
            ? "Both ratings submitted. Scores will be revealed shortly."
            : "Waiting for the other party to submit their rating (or 24 hours to pass)."}
        </div>
      )}

      {ratingStatus.canReveal && ratingStatus.receivedRating && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Your received score: {ratingStatus.receivedRating.weightedScore.toFixed(1)} / 5.0
          </p>
        </div>
      )}
    </div>
  );
}
