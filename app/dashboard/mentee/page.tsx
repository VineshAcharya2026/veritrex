import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/charts/StatCard";
import { Button } from "@/components/ui/button";
import { TrustScoreBadge } from "@/components/rating/TrustScoreBadge";
import { MentorProfileCard } from "@/components/profile/MentorProfileCard";
import { MenteeProfileCard } from "@/components/profile/MenteeProfileCard";
import { isMenteeOnboardingComplete } from "@/lib/mentee-onboarding";
import { pendingFeedbackWhere } from "@/lib/rating-engine";
import { GraduationCap, Clock, UserCircle, AlertTriangle } from "lucide-react";

export default async function MenteeDashboardPage() {
  const session = await getSession();
  if (!session || session.user.role !== "MENTEE") redirect("/login");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [
    activeMentors,
    pendingRequests,
    profile,
    userProfile,
    trustScore,
    strikeCount,
    pendingSessions,
    activeMentorships,
    account,
  ] = await Promise.all([
    prisma.mentorship.count({ where: { menteeId: session.user.id, status: "ACTIVE" } }),
    prisma.mentorship.count({ where: { menteeId: session.user.id, status: "PENDING" } }),
    prisma.menteeProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.trustScoreRecord.findUnique({ where: { userId: session.user.id } }),
    prisma.reliabilityStrike.count({
      where: { userId: session.user.id, createdAt: { gte: ninetyDaysAgo } },
    }),
    prisma.mentorshipSession.findMany({
      where: {
        mentorship: { menteeId: session.user.id },
        ...pendingFeedbackWhere(session.user.id),
      },
      include: {
        mentorship: {
          include: { mentor: { include: { profile: true } } },
        },
      },
      orderBy: { completedAt: "desc" },
    }),
    prisma.mentorship.findMany({
      where: { menteeId: session.user.id, status: "ACTIVE" },
      include: {
        mentor: {
          include: {
            profile: true,
            mentorProfile: true,
            trustScore: { select: { tier: true } },
          },
        },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);

  if (
    !isMenteeOnboardingComplete({
      firstName: userProfile?.firstName,
      lastName: userProfile?.lastName,
      phone: account?.phone,
      ...(profile ?? {}),
    })
  ) {
    redirect("/dashboard/mentee/onboarding");
  }

  const selfName = userProfile
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : session.user.name || "Mentee";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Welcome, {session.user.name}</h1>
        <p className="mt-1 text-sm text-muted">Find mentors and grow your career with guided support.</p>
        <div className="mt-2 flex items-center gap-3">
          <TrustScoreBadge tier={trustScore?.tier ?? "EMERGING"} size="lg" />
          {strikeCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              {strikeCount} strike{strikeCount !== 1 ? "s" : ""} (90d)
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MenteeProfileCard
            mentee={{
              userId: session.user.id,
              name: selfName,
              avatar: userProfile?.avatar ?? null,
              currentRole: profile?.currentRole,
              currentStatus: profile?.currentStatus,
              careerGoal: profile?.careerGoal,
              goals: profile?.goals,
              skills: profile?.desiredSkills ?? [],
              tier: trustScore?.tier ?? "EMERGING",
            }}
          />
        </div>
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-primary">Your mentors</h2>
            <Link href="/dashboard/mentee/mentors" className="text-sm text-accent hover:underline">
              Find more
            </Link>
          </div>
          {activeMentorships.length === 0 ? (
            <p className="rounded-xl border border-primary/8 bg-white p-5 text-sm text-muted shadow-card">
              No active mentors yet — browse the mentor directory to get started.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeMentorships.map((m) => {
                const mp = m.mentor.mentorProfile;
                return (
                  <MentorProfileCard
                    key={m.mentorId}
                    compact
                    mentor={{
                      userId: m.mentorId,
                      name: m.mentor.profile
                        ? `${m.mentor.profile.firstName} ${m.mentor.profile.lastName}`
                        : "Mentor",
                      avatar: m.mentor.profile?.avatar ?? null,
                      title: mp?.title,
                      company: mp?.company,
                      headline: mp?.professionalHeadline,
                      city: mp?.city,
                      industry: mp?.industry,
                      expertise: mp?.expertise ?? [],
                      tier: m.mentor.trustScore?.tier ?? "EMERGING",
                      isEliteFounder100: mp?.isEliteFounder100,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active mentors" value={activeMentors} icon={GraduationCap} />
        <StatCard label="Pending requests" value={pendingRequests} icon={Clock} />
      </div>

      <div
        className={
          pendingSessions.length > 0
            ? "rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3"
            : "rounded-xl border border-primary/8 bg-white p-5 shadow-card space-y-3"
        }
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            className={`font-semibold ${
              pendingSessions.length > 0 ? "text-amber-800" : "text-primary"
            }`}
          >
            Sessions awaiting feedback
          </h2>
          <Link href="/dashboard/mentee/ratings" className="text-sm text-accent hover:underline">
            Ratings & Trust
          </Link>
        </div>
        {pendingSessions.length === 0 ? (
          <p className="text-sm text-muted">
            No open sessions. Open Ratings & Trust to see your tier, strikes, and how private ratings work.
          </p>
        ) : (
          pendingSessions.map((s) => {
            const mentorName = s.mentorship.mentor.profile
              ? `${s.mentorship.mentor.profile.firstName} ${s.mentorship.mentor.profile.lastName}`
              : "Mentor";
            return (
              <div
                key={s.id}
                className="flex items-center justify-between border-t border-amber-200 pt-2 first:border-0 first:pt-0"
              >
                <span className="text-sm text-amber-900">{mentorName}</span>
                <Link
                  href={`/dashboard/session/${s.id}/rate`}
                  className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent/90"
                >
                  {s.outcome ? "Rate" : "Log outcome"}
                </Link>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="accent" asChild>
          <Link href="/dashboard/feed">Community feed</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/mentee/ratings">Ratings & Trust</Link>
        </Button>
        <Button variant="outline" asChild>
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
