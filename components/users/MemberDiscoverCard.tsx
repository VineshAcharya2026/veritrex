import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EliteFounderBadge } from "@/components/mentor/EliteFounderBadge";
import { ExternalLink, Linkedin } from "lucide-react";
import type { DiscoveredUser } from "@/app/api/friends/route";

export function MemberDiscoverCard({
  user,
  score,
  reasons,
}: {
  user: DiscoveredUser;
  score?: number;
  reasons?: string[];
}) {
  const name = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user.role === "MENTOR"
      ? "Mentor"
      : "Mentee";

  const profileHref =
    user.role === "MENTOR" ? `/mentor/${user.userId}` : `/mentee/${user.userId}`;

  const subtitle =
    user.role === "MENTOR"
      ? [user.title, user.company, user.industry, user.city].filter(Boolean).join(" · ")
      : [
          user.currentDesignation || user.currentRole,
          user.preferredIndustry,
          user.city,
        ].filter(Boolean).join(" · ");

  return (
    <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user.profile?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={profileHref} className="font-semibold text-primary hover:underline">
                {name}
              </Link>
              <Badge variant="accent">{user.role}</Badge>
              {user.isEliteFounder100 && <EliteFounderBadge show />}
            </div>
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
            {user.expertise && user.expertise.length > 0 && (
              <p className="mt-1 line-clamp-2 text-xs text-muted">
                {user.expertise.slice(0, 4).join(", ")}
              </p>
            )}
            {reasons && reasons.length > 0 && (
              <p className="mt-2 text-xs text-muted">{reasons.join(" · ")}</p>
            )}
            {typeof score === "number" && score > 0 && (
              <p className="mt-1 text-xs font-medium text-accent">Match score {score}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <Link
            href={profileHref}
            className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
          >
            View profile <ExternalLink className="h-3 w-3" />
          </Link>
          {user.linkedInUrl && (
            <a
              href={user.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary"
            >
              <Linkedin className="h-3 w-3" /> LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
