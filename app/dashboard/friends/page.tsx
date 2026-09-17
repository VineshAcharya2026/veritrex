"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MentorFriendCard } from "@/components/mentor/MentorFriendCard";
import { Alert } from "@/components/ui/alert";
import { useSession } from "@/lib/auth/client";

type MentorMatch = {
  score: number;
  reasons: string[];
  user: Parameters<typeof MentorFriendCard>[0]["mentor"] & { userId: string };
};

type MenteeMatch = {
  score: number;
  reasons: string[];
  user: {
    userId: string;
    role: "MENTEE";
    currentDesignation?: string | null;
    currentRole?: string | null;
    preferredIndustry?: string | null;
    city?: string | null;
    guidanceAreas?: string[];
    profile?: {
      firstName: string;
      lastName: string;
      avatar?: string | null;
    } | null;
  };
};

export default function FriendsPage() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<(MentorMatch | MenteeMatch)[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setMatches(data.matches ?? []);
      });
  }, []);

  const isMentor = session?.user?.role === "MENTOR";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Find your friends"
        description={
          isMentor
            ? "Discover mentors with similar expertise, industry, seniority, and interests."
            : "Connect with mentees who share your goals, industry focus, and guidance areas."
        }
      />
      {error && <Alert variant="error">{error}</Alert>}
      {matches.length === 0 && !error && (
        <p className="text-sm text-muted">
          No matches yet. Complete your profile to improve recommendations.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((m) => {
          if (isMentor && "company" in m.user) {
            return (
              <MentorFriendCard
                key={m.user.userId}
                mentor={m.user}
                score={m.score}
                reasons={m.reasons}
              />
            );
          }

          const u = m.user as MenteeMatch["user"];
          const name = u.profile
            ? `${u.profile.firstName} ${u.profile.lastName}`
            : "Mentee";
          return (
            <div
              key={u.userId}
              className="rounded-xl border border-primary/8 bg-white p-5 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {u.profile?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.profile.avatar} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/mentee/${u.userId}`} className="font-semibold text-primary hover:underline">
                    {name}
                  </Link>
                  <p className="text-xs text-muted">
                    {[u.currentDesignation || u.currentRole, u.preferredIndustry, u.city]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {m.reasons.length > 0 && (
                    <p className="mt-2 text-xs text-muted">{m.reasons.join(" · ")}</p>
                  )}
                  <p className="mt-1 text-xs font-medium text-accent">Match score {m.score}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
