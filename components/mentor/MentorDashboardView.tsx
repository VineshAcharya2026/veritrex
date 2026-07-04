"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/charts/StatCard";
import { Button } from "@/components/ui/button";
import { EliteFounderBadge } from "@/components/mentor/EliteFounderBadge";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { MentorRatesMenteeForm } from "@/components/rating/MentorRatesMenteeForm";
import {
  Award, Coins, Globe, Star, Users, Clock, Briefcase, MapPin,
  Building2, Heart, AlertTriangle,
} from "lucide-react";

type PendingSession = {
  sessionId: string;
  menteeName: string;
  completedAt: string | null;
};

type DashboardData = {
  profile: {
    skillsCount: number;
    topSkills: { skill: string; masteryLevel: number }[];
    isEliteFounder100: boolean;
    thoughtLeadershipScore: number;
    contentCount: number;
  } | null;
  credits: { balance: number; lifetime: number };
  ratings: { average: number | null; count: number };
  trustScore: { tier: string; totalScore: number };
  strikeCount: number;
  nationBuilding: {
    professionalsGuided: number;
    freeSessions: number;
    placed: number;
    promoted: number;
    startedVenture: number;
    careerChangers: number;
    citiesReached: number;
    industriesCovered: number;
  };
  activeMentees: number;
  pendingRequests: number;
  pendingSessions: PendingSession[];
};

export function MentorDashboardView({ userName }: { userName: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [ratingSessionId, setRatingSessionId] = useState<string | null>(null);

  function load() {
    fetch("/api/mentor/dashboard")
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(() => { load(); }, []);

  if (!data) {
    return <div className="h-64 animate-pulse rounded-xl bg-primary/5" />;
  }

  const nb = data.nationBuilding;
  const ratingSession = ratingSessionId
    ? data.pendingSessions.find((s) => s.sessionId === ratingSessionId)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Welcome, {userName}</h1>
          <p className="mt-1 text-sm text-muted">
            Your impact, reputation, and nation-building footprint at a glance.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <TrustScoreBadge
              tier={data.trustScore.tier}
              score={data.trustScore.totalScore}
              size="lg"
            />
            {data.strikeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {data.strikeCount} strike{data.strikeCount !== 1 ? "s" : ""} (90d)
              </span>
            )}
          </div>
        </div>
        <EliteFounderBadge show={data.profile?.isEliteFounder100 ?? false} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Skills & mastery"
          value={data.profile?.skillsCount ?? 0}
          icon={Award}
          trend={
            data.profile?.topSkills?.[0]
              ? `Top: ${data.profile.topSkills[0].skill} (${data.profile.topSkills[0].masteryLevel}/5)`
              : undefined
          }
        />
        <StatCard label="Credits earned" value={data.credits.lifetime} icon={Coins} trend={`Balance: ${data.credits.balance}`} />
        <StatCard
          label="Rating (corrected)"
          value={data.ratings.average ?? "\u2014"}
          icon={Star}
          trend={`${data.ratings.count} session${data.ratings.count !== 1 ? "s" : ""}`}
        />
        <StatCard label="TrustHire posts" value={data.profile?.contentCount ?? 0} icon={Briefcase} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Active mentees" value={data.activeMentees} icon={Users} />
        <StatCard label="Pending requests" value={data.pendingRequests} icon={Clock} />
        <StatCard label="Thought Leadership" value={data.profile?.thoughtLeadershipScore ?? 0} icon={Award} />
      </div>

      {/* Pending session ratings */}
      {data.pendingSessions.length > 0 && !ratingSessionId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <h2 className="font-semibold text-amber-800">Sessions awaiting your rating</h2>
          {data.pendingSessions.map((s) => (
            <div key={s.sessionId} className="flex items-center justify-between border-t border-amber-200 pt-2 first:border-0 first:pt-0">
              <span className="text-sm text-amber-900">{s.menteeName}</span>
              <Button size="sm" variant="accent" onClick={() => setRatingSessionId(s.sessionId)}>
                Rate
              </Button>
            </div>
          ))}
        </div>
      )}

      {ratingSession && (
        <MentorRatesMenteeForm
          sessionId={ratingSession.sessionId}
          menteeName={ratingSession.menteeName}
          onSubmitted={() => { setRatingSessionId(null); load(); }}
        />
      )}

      {/* Nation building */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-primary">Nation building</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Professionals guided" value={nb.professionalsGuided} icon={Users} />
          <StatCard label="Placed / promoted" value={nb.placed + nb.promoted} icon={Briefcase} />
          <StatCard label="Started ventures" value={nb.startedVenture} icon={Globe} />
          <StatCard label="Career changers" value={nb.careerChangers} icon={Heart} />
          <StatCard label="Cities reached" value={nb.citiesReached} icon={MapPin} />
          <StatCard label="Industries covered" value={nb.industriesCovered} icon={Building2} />
          <StatCard label="Free sessions" value={nb.freeSessions} icon={Heart} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="accent" asChild>
          <Link href="/dashboard/mentor/mentees">Manage mentees</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentor/profile">Edit profile</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentor/friends">Find your friends</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentor/inner-circle">Inner Circle</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentor/nation-building">Nation building</Link>
        </Button>
      </div>
    </div>
  );
}
