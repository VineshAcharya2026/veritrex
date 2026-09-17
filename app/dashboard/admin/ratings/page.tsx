import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/charts/StatCard";
import { Button } from "@/components/ui/button";
import { AdminIntegrityActions } from "@/components/admin/AdminIntegrityActions";
import { AlertTriangle, Flag, Star, Clock, Shield } from "lucide-react";

export default async function AdminRatingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [
    openCheatFlags,
    totalRatings,
    pendingOutcomes,
    strikeEvents,
    trustRecords,
  ] = await Promise.all([
    prisma.cheatFlag.count({ where: { reviewed: false } }),
    prisma.sessionRating.count(),
    prisma.mentorshipSession.count({ where: { outcome: null } }),
    prisma.reliabilityStrike.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),
    prisma.trustScoreRecord.groupBy({
      by: ["tier"],
      _count: { id: true },
    }),
  ]);

  // Pending rating = COMPLETED with under 2 ratings submitted
  const completedSessions = await prisma.mentorshipSession.findMany({
    where: { outcome: "COMPLETED" },
    include: {
      ratings: { select: { id: true } },
      mentorship: {
        include: {
          mentor: { include: { profile: true } },
          mentee: { include: { profile: true } },
        },
      },
    },
    orderBy: { completedAt: "desc" },
    take: 40,
  });

  const awaitingBilateral = completedSessions.filter((s) => s.ratings.length < 2);

  const openOutcomeSessions = await prisma.mentorshipSession.findMany({
    where: { outcome: null },
    include: {
      mentorship: {
        include: {
          mentor: { include: { profile: true } },
          mentee: { include: { profile: true } },
        },
      },
    },
    orderBy: { scheduledAt: "desc" },
    take: 20,
  });

  const flaggedStrikeGroups = await prisma.reliabilityStrike.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: ninetyDaysAgo } },
    _count: { id: true },
  });
  const usersWith3PlusStrikes = flaggedStrikeGroups.filter((g) => g._count.id >= 3).length;

  const tierCounts = Object.fromEntries(
    trustRecords.map((r) => [r.tier, r._count.id])
  ) as Record<string, number>;

  function name(profile: { firstName: string; lastName: string } | null | undefined) {
    return profile ? `${profile.firstName} ${profile.lastName}` : "Unknown";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ratings & Trust"
        description="Platform integrity for private session ratings, TrustScore tiers, strikes, and cheating flags. Raw stars are never public."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/cheat-flags">Review cheat flags</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/strikes">View strikes</Link>
            </Button>
          </>
        }
      />

      <AdminIntegrityActions />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Session ratings stored" value={totalRatings} icon={Star} />
        <StatCard label="Open cheat flags" value={openCheatFlags} icon={Flag} />
        <StatCard label="Users ≥3 strikes (90d)" value={usersWith3PlusStrikes} icon={AlertTriangle} />
        <StatCard label="Strike events (90d)" value={strikeEvents} icon={Shield} />
        <StatCard label="Sessions missing outcome" value={pendingOutcomes} icon={Clock} />
        <StatCard
          label="Completed, rating open"
          value={awaitingBilateral.length}
          icon={Star}
        />
      </div>

      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <h2 className="font-semibold text-primary">TrustScore tier distribution</h2>
        <p className="mt-1 text-sm text-muted">
          Public badge only — Emerging (Grey), Established (Blue), Recognised (Teal), Distinguished (Gold).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {(
            [
              ["EMERGING", "Emerging / Grey"],
              ["ESTABLISHED", "Established / Blue"],
              ["RECOGNISED", "Recognised / Teal"],
              ["DISTINGUISHED", "Distinguished / Gold"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="rounded-lg border border-primary/8 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{tierCounts[key] ?? 0}</p>
              <p className="text-xs text-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3">
          <h2 className="font-semibold text-primary">Completed — waiting on ratings</h2>
          {awaitingBilateral.length === 0 ? (
            <p className="text-sm text-muted">All completed sessions have bilateral ratings (or none yet).</p>
          ) : (
            awaitingBilateral.slice(0, 12).map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-1 border-b border-primary/5 pb-2 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-primary">
                  <Link
                    href={`/dashboard/admin/users/${s.mentorship.mentorId}`}
                    className="hover:underline"
                  >
                    {name(s.mentorship.mentor.profile)}
                  </Link>
                  {" → "}
                  <Link
                    href={`/dashboard/admin/users/${s.mentorship.menteeId}`}
                    className="hover:underline"
                  >
                    {name(s.mentorship.mentee.profile)}
                  </Link>
                </span>
                <span className="text-xs text-muted">
                  {s.ratings.length}/2 · session {s.id.slice(0, 8)}…
                </span>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3">
          <h2 className="font-semibold text-primary">Sessions missing outcome</h2>
          {openOutcomeSessions.length === 0 ? (
            <p className="text-sm text-muted">Every scheduled session has an outcome logged.</p>
          ) : (
            openOutcomeSessions.slice(0, 12).map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-1 border-b border-primary/5 pb-2 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-primary">
                  <Link
                    href={`/dashboard/admin/users/${s.mentorship.mentorId}`}
                    className="hover:underline"
                  >
                    {name(s.mentorship.mentor.profile)}
                  </Link>
                  {" → "}
                  <Link
                    href={`/dashboard/admin/users/${s.mentorship.menteeId}`}
                    className="hover:underline"
                  >
                    {name(s.mentorship.mentee.profile)}
                  </Link>
                </span>
                <span className="text-xs text-muted">
                  {new Date(s.scheduledAt).toLocaleDateString()} · session {s.id.slice(0, 8)}…
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
