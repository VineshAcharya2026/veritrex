import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/charts/StatCard";
import { Button } from "@/components/ui/button";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { GraduationCap, Clock, UserCircle, AlertTriangle } from "lucide-react";

export default async function MenteeDashboardPage() {
  const session = await getSession();
  if (!session || session.user.role !== "MENTEE") redirect("/login");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [activeMentors, pendingRequests, profile, trustScore, strikeCount, pendingSessions] =
    await Promise.all([
      prisma.mentorship.count({ where: { menteeId: session.user.id, status: "ACTIVE" } }),
      prisma.mentorship.count({ where: { menteeId: session.user.id, status: "PENDING" } }),
      prisma.menteeProfile.findUnique({ where: { userId: session.user.id } }),
      prisma.trustScoreRecord.findUnique({ where: { userId: session.user.id } }),
      prisma.reliabilityStrike.count({
        where: { userId: session.user.id, createdAt: { gte: ninetyDaysAgo } },
      }),
      prisma.mentorshipSession.findMany({
        where: {
          mentorship: { menteeId: session.user.id },
          outcome: "COMPLETED",
          ratings: { none: { raterId: session.user.id } },
        },
        include: {
          mentorship: {
            include: { mentor: { include: { profile: true } } },
          },
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Welcome, {session.user.name}</h1>
        <p className="mt-1 text-sm text-muted">Find mentors and grow your career with guided support.</p>
        <div className="mt-2 flex items-center gap-3">
          <TrustScoreBadge
            tier={trustScore?.tier ?? "EMERGING"}
            score={trustScore?.totalScore ?? 0}
            size="lg"
          />
          {strikeCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {strikeCount} strike{strikeCount !== 1 ? "s" : ""} (90d)
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active mentors" value={activeMentors} icon={GraduationCap} />
        <StatCard label="Pending requests" value={pendingRequests} icon={Clock} />
      </div>

      {pendingSessions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <h2 className="font-semibold text-amber-800">Sessions awaiting your rating</h2>
          {pendingSessions.map((s) => {
            const mentorName = s.mentorship.mentor.profile
              ? `${s.mentorship.mentor.profile.firstName} ${s.mentorship.mentor.profile.lastName}`
              : "Mentor";
            return (
              <div key={s.id} className="flex items-center justify-between border-t border-amber-200 pt-2 first:border-0 first:pt-0">
                <span className="text-sm text-amber-900">{mentorName}</span>
                <Link
                  href={`/dashboard/mentee/goals?rateSession=${s.id}`}
                  className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent/90"
                >
                  Rate
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {profile?.careerGoal && (
        <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
          <h2 className="font-semibold text-primary">Your career goal</h2>
          <p className="mt-2 text-sm text-muted">{profile.careerGoal}</p>
        </div>
      )}

      {profile?.goals && !profile.careerGoal && (
        <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
          <h2 className="font-semibold text-primary">Your goals</h2>
          <p className="mt-2 text-sm text-muted">{profile.goals}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="accent" asChild>
          <Link href="/dashboard/mentee/mentors">Find mentors</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentee/profile">
            <UserCircle className="mr-1 h-4 w-4" />My profile
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentee/goals">Edit goals</Link>
        </Button>
      </div>
    </div>
  );
}
