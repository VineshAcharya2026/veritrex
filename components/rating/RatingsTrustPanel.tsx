import Link from "next/link";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Shield } from "lucide-react";

export type PendingSessionRow = {
  sessionId: string;
  counterpartName: string;
  outcome: string | null;
  scheduledAt?: string | Date | null;
};

export function RatingsTrustPanel({
  role,
  tier,
  strikeCount,
  pendingSessions,
  ratedCount,
}: {
  role: "MENTOR" | "MENTEE";
  tier: string;
  strikeCount: number;
  pendingSessions: PendingSessionRow[];
  ratedCount?: number;
}) {
  const counterpart = role === "MENTOR" ? "mentee" : "mentor";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-primary">Your public TrustScore</h2>
            <p className="mt-1 text-sm text-muted">
              Profiles show only your tier (Grey / Blue / Teal / Gold). Raw session star
              ratings stay private — never shown to your {counterpart} or the public.
            </p>
          </div>
          <TrustScoreBadge tier={tier} size="lg" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-primary/8 bg-primary/[0.02] p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Reliability</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-primary">
              {strikeCount > 0 ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-600">
                    {strikeCount} strike{strikeCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted">(last 90 days)</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 text-teal-600" />
                  No strikes in the last 90 days
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-muted">
              Strikes come from no-shows and late cancels — separate from star ratings.
            </p>
          </div>
          <div className="rounded-lg border border-primary/8 bg-primary/[0.02] p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Session ratings</p>
            <p className="mt-1 text-sm text-primary">
              {typeof ratedCount === "number" ? (
                <span className="font-semibold">{ratedCount}</span>
              ) : (
                <span className="font-semibold">—</span>
              )}{" "}
              ratings you&apos;ve submitted
            </p>
            <p className="mt-1 text-xs text-muted">
              After each completed session, both parties rate each other on 6 weighted questions.
            </p>
          </div>
        </div>
      </div>

      <div
        className={
          pendingSessions.length > 0
            ? "rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3"
            : "rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3"
        }
      >
        <div className="flex items-center gap-2">
          <Clock
            className={`h-4 w-4 ${pendingSessions.length > 0 ? "text-amber-700" : "text-muted"}`}
          />
          <h2
            className={`font-semibold ${
              pendingSessions.length > 0 ? "text-amber-800" : "text-primary"
            }`}
          >
            Sessions awaiting feedback
          </h2>
        </div>

        {pendingSessions.length === 0 ? (
          <p className="text-sm text-muted">
            No open sessions. When a session ends, log the outcome here — then rate your{" "}
            {counterpart} if it completed normally.
          </p>
        ) : (
          pendingSessions.map((s) => (
            <div
              key={s.sessionId}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200 pt-2 first:border-0 first:pt-0"
            >
              <div>
                <p className="text-sm font-medium text-amber-900">{s.counterpartName}</p>
                <p className="text-xs text-amber-800/80">
                  {s.outcome ? "Completed — rating due" : "Outcome not logged yet"}
                </p>
              </div>
              <Button size="sm" variant="accent" asChild>
                <Link href={`/dashboard/session/${s.sessionId}/rate`}>
                  {s.outcome ? "Rate session" : "Log outcome"}
                </Link>
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <h2 className="font-semibold text-primary">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Log what happened: completed, no-show, mutual cancel (4+ hrs), or late cancel.</li>
          <li>If completed, rate each other on private star dimensions (hidden until both submit or 24h).</li>
          <li>Your public TrustScore tier updates from blended ratings + verification + activity + outcomes + endorsements.</li>
        </ol>
      </div>
    </div>
  );
}
