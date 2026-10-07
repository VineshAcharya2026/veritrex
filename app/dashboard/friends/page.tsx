"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MemberDiscoverCard } from "@/components/users/MemberDiscoverCard";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { DiscoveredUser } from "@/app/api/friends/route";

type Match = { score: number; reasons: string[]; user: DiscoveredUser };

type RoleFilter = "ALL" | "MENTOR" | "MENTEE";

export default function FriendsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("ALL");

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setMatches(data.matches ?? []);
      });
  }, []);

  const visible = useMemo(() => {
    if (filter === "ALL") return matches;
    return matches.filter((m) => m.user.role === filter);
  }, [matches, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find friends"
        description="Discover mentors and mentees across Veritrex — peers and cross-role connections based on your profile."
      />
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ALL", "All"],
            ["MENTOR", "Mentors"],
            ["MENTEE", "Mentees"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium",
              filter === key ? "bg-accent text-white" : "bg-primary/5 text-muted hover:bg-primary/10"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 && !error && (
        <p className="text-sm text-muted">
          No members to show yet. Complete your profile to improve recommendations.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((m) => (
          <MemberDiscoverCard
            key={m.user.userId}
            user={m.user}
            score={m.score}
            reasons={m.reasons}
          />
        ))}
      </div>
    </div>
  );
}
