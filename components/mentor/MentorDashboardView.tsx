"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/charts/StatCard";
import { Button } from "@/components/ui/button";
import { EliteFounderBadge } from "@/components/mentor/EliteFounderBadge";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { MentorProfileCard, type MentorCardData } from "@/components/profile/MentorProfileCard";
import { MenteeProfileCard, type MenteeCardData } from "@/components/profile/MenteeProfileCard";
import {
  Award, Coins, Globe, Users, Clock, Briefcase,
  Heart, AlertTriangle,
} from "lucide-react";

type PendingSession = {
  sessionId: string;
  menteeName: string;
  completedAt: string | null;
  outcome: string | null;
};

type DashboardData = {
  profile: {
    skillsCount: number;
    topSkills: { skill: string; masteryLevel: number }[];
    isEliteFounder100: boolean;
    thoughtLeadershipScore: number;
    contentCount: number;
  } | null;
  selfCard: MentorCardData;
  menteeCards: MenteeCardData[];
  credits: { balance: number; lifetime: number };
  cashOutEligibility: {
    eligible: boolean;
    realSessions: number;
    requiredSessions: number;
    hasOpenFlags: boolean;
  };
  trustScore: { tier: string };
  strikeCount: number;
  nationBuilding: {
    kpis: {
      peopleImpacted: number;
      careersTransformed: number;
      opportunitiesCreated: number;
      volunteerHours: number;
    };
    composite: number;
  };
  activeMentees: number;
  pendingRequests: number;
  pendingSessions: PendingSession[];
};

export function MentorDashboardView({ userName }: { userName: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [cashOutBusy, setCashOutBusy] = useState(false);
  const [cashOutMessage, setCashOutMessage] = useState("");

  function load() {
    fetch("/api/mentor/dashboard")
      .then((r) => r.json())
      .then(setData);
  }

  useEffect(() => { load(); }, []);

  async function cashOut() {
    setCashOutBusy(true);
    setCashOutMessage("");
    try {
      const res = await fetch("/api/mentor/credits/cashout", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setCashOutMessage(body.error || "Cash-out failed");
        return;
      }
      setCashOutMessage(`Cashed out ${body.cashedOut} credits.`);
      load();
    } finally {
      setCashOutBusy(false);
    }
  }

  if (!data) {
    return <div className="h-64 animate-pulse rounded-xl bg-primary/5" />;
  }

  const nb = data.nationBuilding;
  const cashOutReason = data.cashOutEligibility.hasOpenFlags
    ? "Credit cash-out is paused while a rating review is open on your account."
    : `Complete ${Math.max(0, data.cashOutEligibility.requiredSessions - data.cashOutEligibility.realSessions)} more bilateral, unflagged rated sessions to unlock cash-out.`;
  const canCashOut =
    data.cashOutEligibility.eligible && data.credits.balance > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Welcome, {userName}</h1>
          <p className="mt-1 text-sm text-muted">
            Your impact, reputation, and Impact Score footprint at a glance.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <TrustScoreBadge tier={data.trustScore.tier} size="lg" />
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

      {data.selfCard && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <MentorProfileCard mentor={data.selfCard} />
          </div>
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-primary">Your mentees</h2>
              <Link href="/dashboard/mentor/mentees" className="text-sm text-accent hover:underline">
                Manage
              </Link>
            </div>
            {data.menteeCards.length === 0 ? (
              <p className="rounded-xl border border-primary/8 bg-white p-5 text-sm text-muted shadow-card">
                No active mentees yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.menteeCards.map((m) => (
                  <MenteeProfileCard key={m.userId} mentee={m} compact />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
          label="Bilateral rated sessions"
          value={data.cashOutEligibility.realSessions}
          icon={Award}
          trend={
            data.cashOutEligibility.eligible
              ? "Eligible to cash out"
              : `${data.cashOutEligibility.requiredSessions} bilateral sessions needed`
          }
        />
        <StatCard label="Veritrex posts" value={data.profile?.contentCount ?? 0} icon={Briefcase} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Active mentees" value={data.activeMentees} icon={Users} />
        <StatCard label="Pending requests" value={data.pendingRequests} icon={Clock} />
        <StatCard label="Thought Leadership" value={data.profile?.thoughtLeadershipScore ?? 0} icon={Award} />
      </div>

      {/* Pending session ratings — always show entry point */}
      <div
        className={
          data.pendingSessions.length > 0
            ? "rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3"
            : "rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3"
        }
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            className={`font-semibold ${
              data.pendingSessions.length > 0 ? "text-amber-800" : "text-primary"
            }`}
          >
            Sessions awaiting feedback
          </h2>
          <Link
            href="/dashboard/mentor/ratings"
            className="text-sm text-accent hover:underline"
          >
            Ratings & Trust
          </Link>
        </div>
        {data.pendingSessions.length === 0 ? (
          <p className="text-sm text-muted">
            No open sessions. Use Ratings & Trust to see your tier, strikes, and how private ratings work.
          </p>
        ) : (
          data.pendingSessions.map((s) => (
            <div
              key={s.sessionId}
              className="flex items-center justify-between border-t border-amber-200 pt-2 first:border-0 first:pt-0"
            >
              <span className="text-sm text-amber-900">{s.menteeName}</span>
              <Button size="sm" variant="accent" asChild>
                <Link href={`/dashboard/session/${s.sessionId}/rate`}>
                  {s.outcome ? "Rate" : "Log outcome"}
                </Link>
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border border-primary/8 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted">
            <p className="font-medium text-primary">Credit cash-out</p>
            <p className="mt-1">
              {data.cashOutEligibility.eligible
                ? data.credits.balance > 0
                  ? `You can cash out your balance of ${data.credits.balance} credits.`
                  : "You're eligible, but your credit balance is zero."
                : cashOutReason}
            </p>
            {cashOutMessage && <p className="mt-2 text-accent">{cashOutMessage}</p>}
          </div>
          <Button
            variant="accent"
            disabled={!canCashOut || cashOutBusy}
            title={!canCashOut ? cashOutReason : undefined}
            onClick={cashOut}
          >
            {cashOutBusy ? "Cashing out…" : "Cash out"}
          </Button>
        </div>
      </div>

      {/* Impact Score */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-primary">
            Impact Score
            <span className="ml-2 text-sm font-normal text-accent">
              {nb.composite.toLocaleString()}
            </span>
          </h2>
          <Link href="/dashboard/mentor/nation-building" className="text-sm text-accent hover:underline">
            View & add contributions
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="People Impacted" value={nb.kpis.peopleImpacted} icon={Users} />
          <StatCard label="Careers Transformed" value={nb.kpis.careersTransformed} icon={Globe} />
          <StatCard label="Opportunities Created" value={nb.kpis.opportunitiesCreated} icon={Briefcase} />
          <StatCard label="Volunteer Hours" value={nb.kpis.volunteerHours} icon={Heart} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="accent" asChild>
          <Link href="/dashboard/feed">Community feed</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentor/ratings">Ratings & Trust</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentor/mentees">Manage mentees</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentor/profile">Edit profile</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/friends">Find your friends</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentor/inner-circle">Inner Circle</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentor/nation-building">Impact Score</Link>
        </Button>
      </div>
    </div>
  );
}
