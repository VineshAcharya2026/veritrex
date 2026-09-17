import Link from "next/link";
import { MapPin, Linkedin } from "lucide-react";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { ProfileEndorseSection } from "@/components/rating/ProfileEndorseSection";

export function ProfileHeader({
  name,
  avatar,
  coverImage,
  headline,
  summary,
  location,
  tier,
  userId,
  primaryAction,
  linkedInUrl,
}: {
  name: string;
  avatar: string | null;
  coverImage: string | null;
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  tier: string;
  userId: string;
  primaryAction?: { href: string; label: string };
  linkedInUrl?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-primary/8 bg-white shadow-card">
      <div
        className="h-32 bg-gradient-to-r from-landing-navy via-landing-teal/80 to-landing-gold/50 sm:h-40"
        style={
          coverImage
            ? {
                backgroundImage: `url(${coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
      <div className="relative px-5 pb-5 sm:px-6">
        <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-accent/10 text-3xl font-bold text-accent shadow-subtle sm:-mt-14 sm:h-28 sm:w-28">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            name.charAt(0)
          )}
        </div>

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold text-primary">{name}</h1>
            <TrustScoreBadge tier={tier} />
            {headline && <p className="text-sm text-muted">{headline}</p>}
            {location && (
              <p className="flex items-center gap-1 text-xs text-muted">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </p>
            )}
            <div className="pt-1">
              <ProfileEndorseSection userId={userId} />
            </div>
            {summary && (
              <p className="mt-2 max-w-2xl text-sm text-primary/70">{summary}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {primaryAction && (
              <Link
                href={primaryAction.href}
                className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
              >
                {primaryAction.label}
              </Link>
            )}
            {linkedInUrl && (
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-primary/10 px-4 py-2.5 text-sm text-accent hover:bg-accent/5"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
