import Link from "next/link";
import { ArrowUpRight, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";

export type MenteeCardData = {
  userId: string;
  name: string;
  avatar?: string | null;
  currentRole?: string | null;
  currentStatus?: string | null;
  careerGoal?: string | null;
  goals?: string | null;
  tier?: string;
  skills?: string[];
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusLabel(status?: string | null) {
  if (!status) return null;
  return status
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export function MenteeProfileCard({
  mentee,
  cta,
  compact,
}: {
  mentee: MenteeCardData;
  cta?: React.ReactNode;
  compact?: boolean;
}) {
  const goal = mentee.careerGoal || mentee.goals;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-primary/8 bg-white shadow-card transition-shadow hover:shadow-md ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-br from-teal-500/10 via-primary/5 to-transparent" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-teal-50 text-sm font-bold text-teal-800 shadow-sm">
          {mentee.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mentee.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(mentee.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-primary">{mentee.name}</h3>
            <TrustScoreBadge tier={mentee.tier ?? "EMERGING"} />
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {mentee.currentRole || statusLabel(mentee.currentStatus) || "Mentee"}
          </p>
        </div>
      </div>

      {goal && (
        <p className="mt-3 flex gap-2 text-sm text-primary/80">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span className="line-clamp-2">{goal}</span>
        </p>
      )}

      {mentee.skills && mentee.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {mentee.skills.slice(0, 4).map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/mentee/${mentee.userId}`}>
            View profile
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
        {cta}
      </div>
    </div>
  );
}
