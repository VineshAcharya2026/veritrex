import Link from "next/link";
import { MapPin, Building2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { EliteFounderBadge } from "@/components/mentor/EliteFounderBadge";

export type MentorCardData = {
  userId: string;
  name: string;
  avatar?: string | null;
  title?: string | null;
  company?: string | null;
  headline?: string | null;
  city?: string | null;
  industry?: string | null;
  expertise?: string[];
  tier?: string;
  isEliteFounder100?: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MentorProfileCard({
  mentor,
  cta,
  compact,
}: {
  mentor: MentorCardData;
  cta?: React.ReactNode;
  compact?: boolean;
}) {
  const subtitle =
    mentor.headline ||
    [mentor.title, mentor.company].filter(Boolean).join(" at ") ||
    "Mentor";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-primary/8 bg-white shadow-card transition-shadow hover:shadow-md ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-br from-accent/15 via-primary/5 to-transparent" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-primary/10 text-sm font-bold text-primary shadow-sm">
          {mentor.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mentor.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(mentor.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-primary">{mentor.name}</h3>
            <TrustScoreBadge tier={mentor.tier ?? "EMERGING"} />
            {mentor.isEliteFounder100 ? <EliteFounderBadge show /> : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{subtitle}</p>
          {(mentor.city || mentor.industry) && (
            <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
              {mentor.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {mentor.city}
                </span>
              )}
              {mentor.industry && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {mentor.industry}
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {mentor.expertise && mentor.expertise.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {mentor.expertise.slice(0, 4).map((e) => (
            <Badge key={e}>{e}</Badge>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/mentor/${mentor.userId}`}>
            View profile
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
        {cta}
      </div>
    </div>
  );
}
