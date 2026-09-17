"use client";

import { useCallback, useEffect, useState } from "react";
import { SessionOutcomeStep } from "./SessionOutcomeStep";
import { MenteeRatesMentorForm } from "./MenteeRatesMentorForm";
import { MentorRatesMenteeForm } from "./MentorRatesMenteeForm";
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
  ratingPeriodClosed: boolean;
  ratingWindowClosed: boolean;
};

export function SessionRatingFlow({ session }: { session: SessionInfo }) {
  const [outcome, setOutcome] = useState(session.outcome);
  const [ratingStatus, setRatingStatus] = useState<RatingStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const loadRatingStatus = useCallback(() => {
    setStatusError("");
    fetch(`/api/sessions/${session.id}/ratings`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Failed to load rating status"
          );
        }
        return data as RatingStatus;
      })
      .then(setRatingStatus)
      .catch((err: Error) => {
        setStatusError(err.message || "Failed to load rating status");
        setRatingStatus({
          myRatingSubmitted: false,
          otherRatingSubmitted: false,
          ratingPeriodClosed: false,
          ratingWindowClosed: false,
        });
      });
  }, [session.id]);

  useEffect(() => {
    if (outcome === "COMPLETED") loadRatingStatus();
  }, [outcome, submitted, loadRatingStatus]);

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
          {session.userRole === "MENTEE"
            ? "Mentor no-show recorded. A strike was logged against the mentor. Your remaining sessions with them are free — rebook anytime."
            : "Mentor no-show recorded. A reliability strike has been logged on your account."}
        </Alert>
      </div>
    );
  }

  if (outcome === "MENTEE_NO_SHOW") {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <Alert variant="error">
          {session.userRole === "MENTOR"
            ? "Mentee no-show recorded. A strike was logged against the mentee. You received partial credit for the blocked time."
            : "Mentee no-show recorded. A reliability strike has been logged on your account."}
        </Alert>
      </div>
    );
  }

  if (outcome === "MUTUAL_CANCEL") {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <Alert variant="success">
          Session cancelled with 4+ hours notice. No rating and no strike.
        </Alert>
      </div>
    );
  }

  if (outcome === "LATE_CANCEL") {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <Alert variant="error">
          Late cancellation recorded. A reliability strike was logged (separate from star ratings).
          No session rating for this booking.
        </Alert>
      </div>
    );
  }

  if (!ratingStatus) {
    return <div className="h-32 animate-pulse rounded-xl bg-primary/5" />;
  }

  if (statusError) {
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3">
        <Alert variant="error">{statusError}</Alert>
        <button
          type="button"
          className="text-sm font-medium text-accent hover:underline"
          onClick={() => {
            setRatingStatus(null);
            loadRatingStatus();
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!ratingStatus.myRatingSubmitted) {
    if (ratingStatus.ratingWindowClosed) {
      return (
        <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
          <Alert variant="error">
            The 7-day rating window for this session has closed. You can no longer submit a
            rating.
          </Alert>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3">
        {ratingStatus.ratingPeriodClosed && (
          <Alert variant="info">
            The 24-hour blind period has ended. You can still submit your rating within 7 days of
            the session.
          </Alert>
        )}
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

      {!ratingStatus.ratingPeriodClosed && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock className="h-4 w-4" />
          {ratingStatus.otherRatingSubmitted
            ? "Both ratings submitted. Your TrustScore will update shortly."
            : "Waiting for the other party to submit their rating (or 24 hours to pass)."}
        </div>
      )}

      {ratingStatus.ratingPeriodClosed && (
        <p className="text-sm text-muted">
          The rating period is closed. Individual session scores stay private — only your
          public TrustScore tier reflects your reputation.
        </p>
      )}
    </div>
  );
}
