"use client";

import Link from "next/link";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";

export type FeedProfileCardData = {
  userId: string;
  role: string;
  name: string;
  avatar: string | null;
  coverImage: string | null;
  headline: string | null;
  location: string | null;
  tier: string;
  postCount: number;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function FeedProfileCard({
  profile,
  compact = false,
}: {
  profile: FeedProfileCardData;
  compact?: boolean;
}) {
  const profileHref =
    profile.role === "MENTOR"
      ? `/mentor/${profile.userId}`
      : profile.role === "MENTEE"
        ? `/mentee/${profile.userId}`
        : "#";
  const editHref =
    profile.role === "MENTOR"
      ? "/dashboard/mentor/profile"
      : "/dashboard/mentee/profile";

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/8 bg-white p-3 shadow-card">
        <Link
          href={profileHref}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary"
        >
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(profile.name)
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={profileHref} className="font-semibold text-primary hover:underline">
            {profile.name}
          </Link>
          {profile.headline && (
            <p className="truncate text-xs text-muted">{profile.headline}</p>
          )}
          <div className="mt-1">
            <TrustScoreBadge tier={profile.tier} />
          </div>
        </div>
        <Link
          href={profileHref}
          className="shrink-0 text-xs font-medium text-accent hover:underline"
        >
          View
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-primary/8 bg-white shadow-card">
      <div
        className="h-16 bg-gradient-to-r from-landing-navy via-landing-teal/70 to-landing-gold/60"
        style={
          profile.coverImage
            ? {
                backgroundImage: `url(${profile.coverImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />
      <div className="relative px-4 pb-4 pt-0">
        <Link
          href={profileHref}
          className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary/10 text-lg font-bold text-primary shadow-subtle"
        >
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            initials(profile.name)
          )}
        </Link>
        <div className="mt-2">
          <Link href={profileHref} className="font-semibold text-primary hover:underline">
            {profile.name}
          </Link>
          <div className="mt-1">
            <TrustScoreBadge tier={profile.tier} />
          </div>
          {profile.headline && (
            <p className="mt-1 line-clamp-2 text-xs text-muted">{profile.headline}</p>
          )}
          {profile.location && (
            <p className="mt-0.5 text-xs text-muted">{profile.location}</p>
          )}
        </div>
        <div className="mt-3 border-t border-primary/8 pt-3 text-xs text-muted">
          <div className="flex items-center justify-between">
            <span>Posts</span>
            <span className="font-semibold text-primary">{profile.postCount}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          <Link
            href={profileHref}
            className="text-center text-xs font-medium text-accent hover:underline"
          >
            View profile
          </Link>
          <Link
            href={editHref}
            className="text-center text-xs text-muted hover:text-primary"
          >
            Edit profile
          </Link>
        </div>
      </div>
    </div>
  );
}
