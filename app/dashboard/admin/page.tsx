import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/charts/StatCard";
import { Users, GraduationCap, LogIn, Clock, Star, Flag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalMentors,
    totalMentees,
    activeMentorships,
    pendingMentorships,
    totalLogins,
    openCheatFlags,
    sessionRatings,
    strikeEvents,
  ] = await Promise.all([
    prisma.user.count({ where: { status: { not: "DELETED" } } }),
    prisma.user.count({ where: { role: "MENTOR", status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "MENTEE", status: "ACTIVE" } }),
    prisma.mentorship.count({ where: { status: "ACTIVE" } }),
    prisma.mentorship.count({ where: { status: "PENDING" } }),
    prisma.loginEvent.count(),
    prisma.cheatFlag.count({ where: { reviewed: false } }),
    prisma.sessionRating.count(),
    prisma.reliabilityStrike.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),
  ]);

  const recentMentorships = await prisma.mentorship.findMany({
    include: {
      mentor: { include: { profile: true } },
      mentee: { include: { profile: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Super Admin</h1>
          <p className="mt-1 text-sm text-muted">Platform overview, mentorship activity, and rating integrity</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/ratings">Ratings & Trust</Link>
          </Button>
          <Button variant="accent" asChild>
            <Link href="/dashboard/admin/users">Manage users</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total users" value={totalUsers} icon={Users} />
        <StatCard label="Mentors" value={totalMentors} icon={GraduationCap} />
        <StatCard label="Mentees" value={totalMentees} icon={Users} />
        <StatCard label="Active mentorships" value={activeMentorships} icon={GraduationCap} />
        <StatCard label="Pending requests" value={pendingMentorships} icon={Clock} />
        <StatCard label="Total logins" value={totalLogins} icon={LogIn} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-primary">Ratings & Trust</h2>
          <Link href="/dashboard/admin/ratings" className="text-sm text-accent hover:underline">
            Open hub
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Private session ratings" value={sessionRatings} icon={Star} />
          <StatCard label="Open cheat flags" value={openCheatFlags} icon={Flag} />
          <StatCard label="Strikes (90d)" value={strikeEvents} icon={AlertTriangle} />
        </div>
      </div>

      <div className="rounded-xl border border-primary/8 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-primary">Recent mentorships</h2>
          <Link href="/dashboard/admin/mentorships" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {recentMentorships.length === 0 ? (
            <p className="text-sm text-muted">No mentorships yet.</p>
          ) : (
            recentMentorships.map((m) => (
              <div key={m.id} className="flex items-center justify-between border-b border-primary/5 pb-3 last:border-0">
                <p className="text-sm text-primary">
                  {m.mentor.profile?.firstName} {m.mentor.profile?.lastName}
                  <span className="text-muted"> → </span>
                  {m.mentee.profile?.firstName} {m.mentee.profile?.lastName}
                </p>
                <span className="text-xs font-medium text-muted">{m.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
