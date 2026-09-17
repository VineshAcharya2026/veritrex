"use client";

import { useEffect, useState } from "react";
import {
  FeedProfileCard,
  type FeedProfileCardData,
} from "@/components/feed/FeedProfileCard";
import { FeedRightRail } from "@/components/feed/FeedRightRail";

/** LinkedIn-style 3-column page frame used across mentor/mentee dashboards. */
export function SocialPageFrame({
  role,
  profile: initialProfile,
  children,
  hideRightRail = false,
}: {
  role: "MENTOR" | "MENTEE";
  profile?: FeedProfileCardData | null;
  children: React.ReactNode;
  hideRightRail?: boolean;
}) {
  const [profile, setProfile] = useState<FeedProfileCardData | null>(
    initialProfile ?? null
  );

  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile);
      return;
    }
    let cancelled = false;
    fetch("/api/profile/card")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.userId) setProfile(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialProfile]);

  return (
    <div
      className={
        hideRightRail
          ? "mx-auto grid max-w-6xl gap-4 lg:grid-cols-[240px_minmax(0,1fr)]"
          : "mx-auto grid max-w-6xl gap-4 lg:grid-cols-[240px_minmax(0,1fr)_260px]"
      }
    >
      <aside className="hidden lg:block">
        <div className="sticky top-16">
          {profile ? (
            <FeedProfileCard profile={profile} />
          ) : (
            <div className="h-64 animate-pulse rounded-xl bg-white shadow-card" />
          )}
        </div>
      </aside>

      <div className="min-w-0 space-y-4">
        {profile && (
          <div className="lg:hidden">
            <FeedProfileCard profile={profile} compact />
          </div>
        )}
        {children}
      </div>

      {!hideRightRail && (
        <aside className="hidden lg:block">
          <div className="sticky top-16">
            <FeedRightRail role={role} />
          </div>
        </aside>
      )}
    </div>
  );
}
