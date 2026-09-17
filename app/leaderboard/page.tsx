"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { BADGE_META } from "@/lib/nation-building";
import type { NationBuildingBadge } from "@/lib/db/types";

type Leader = {
  rank: number;
  mentorId: string;
  name: string;
  avatar: string | null;
  headline: string | null;
  composite: number;
  topBadge: NationBuildingBadge | null;
};

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);

  useEffect(() => {
    fetch("/api/nation-building/leaderboard")
      .then((r) => r.json())
      .then((data) => setLeaders(data.leaders ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <Trophy className="h-7 w-7 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-primary">Impact Score Leaderboard</h1>
        <p className="mt-1 text-sm text-muted">
          Mentors creating the greatest verified social impact.
        </p>
      </div>

      {leaders === null ? (
        <div className="h-64 animate-pulse rounded-xl bg-primary/5" />
      ) : leaders.length === 0 ? (
        <p className="rounded-xl border border-primary/8 bg-white p-6 text-center text-sm text-muted shadow-card">
          No ranked mentors yet. Verified contributions will appear here.
        </p>
      ) : (
        <ol className="space-y-3">
          {leaders.map((l) => (
            <li key={l.mentorId}>
              <Link
                href={`/mentor/${l.mentorId}`}
                className="flex items-center gap-4 rounded-xl border border-primary/8 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className="w-6 shrink-0 text-center text-lg font-bold text-accent">
                  {l.rank}
                </span>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {l.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.avatar} alt={l.name} className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    l.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-primary">{l.name}</p>
                  {l.headline && <p className="truncate text-xs text-muted">{l.headline}</p>}
                  {l.topBadge && (
                    <span className="mt-1 inline-block rounded-sm bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      {BADGE_META[l.topBadge].label}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{l.composite.toLocaleString()}</p>
                  <p className="text-[11px] uppercase tracking-wider text-muted">Impact</p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
