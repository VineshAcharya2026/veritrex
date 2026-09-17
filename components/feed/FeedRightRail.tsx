"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { BADGE_META } from "@/lib/nation-building";
import type { NationBuildingBadge } from "@/lib/db/types";

type Leader = {
  rank: number;
  mentorId: string;
  name: string;
  composite: number;
  topBadge: NationBuildingBadge | null;
};

const MENTOR_LINKS = [
  { href: "/dashboard/friends", label: "Find Friends" },
  { href: "/dashboard/mentor/nation-building", label: "Impact Score" },
  { href: "/dashboard/mentor/inner-circle", label: "Inner Circle" },
  { href: "/dashboard/mentor", label: "Workspace" },
];

const MENTEE_LINKS = [
  { href: "/dashboard/mentee/mentors", label: "Find Mentors" },
  { href: "/dashboard/friends", label: "Find Friends" },
  { href: "/dashboard/mentee/mentorships", label: "My Mentorships" },
  { href: "/dashboard/mentee/goals", label: "Goals" },
  { href: "/dashboard/mentee", label: "Workspace" },
];

export function FeedRightRail({ role }: { role: "MENTOR" | "MENTEE" }) {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const links = role === "MENTOR" ? MENTOR_LINKS : MENTEE_LINKS;

  useEffect(() => {
    fetch("/api/nation-building/leaderboard?limit=5")
      .then((r) => r.json())
      .then((d) => setLeaders(d.leaders ?? []))
      .catch(() => setLeaders([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/8 bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-primary">Impact leaders</h3>
        </div>
        {leaders.length === 0 ? (
          <p className="text-xs text-muted">No ranked mentors yet.</p>
        ) : (
          <ol className="space-y-2">
            {leaders.map((l) => (
              <li key={l.mentorId}>
                <Link
                  href={`/mentor/${l.mentorId}`}
                  className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-primary/[0.03]"
                >
                  <span className="w-4 text-xs font-bold text-accent">{l.rank}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-primary">{l.name}</p>
                    {l.topBadge && (
                      <p className="truncate text-[11px] text-muted">
                        {BADGE_META[l.topBadge].label}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {l.composite.toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        <Link
          href="/leaderboard"
          className="mt-3 block text-center text-xs font-medium text-accent hover:underline"
        >
          View full leaderboard
        </Link>
      </div>

      <div className="rounded-xl border border-primary/8 bg-white p-4 shadow-card">
        <h3 className="mb-2 text-sm font-semibold text-primary">Grow your network</h3>
        <ul className="space-y-2 text-xs">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-accent hover:underline">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-2 text-[11px] leading-relaxed text-muted">
        <p>
          {BRAND.name} · {BRAND.tagline}
        </p>
        <p className="mt-1">
          <Link href="/" className="hover:underline">
            About
          </Link>
          {" · "}
          <a href={`mailto:${BRAND.email}`} className="hover:underline">
            Contact
          </a>
        </p>
      </div>
    </div>
  );
}
