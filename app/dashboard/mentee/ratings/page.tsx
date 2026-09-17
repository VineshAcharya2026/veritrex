import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { RatingsTrustPanel } from "@/components/rating/RatingsTrustPanel";
import { pendingFeedbackWhere } from "@/lib/rating-engine";

export default async function MenteeRatingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "MENTEE") redirect("/login");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [trustScore, strikeCount, ratedCount, pendingSessions] = await Promise.all([
    prisma.trustScoreRecord.findUnique({ where: { userId: session.user.id } }),
    prisma.reliabilityStrike.count({
      where: { userId: session.user.id, createdAt: { gte: ninetyDaysAgo } },
    }),
    prisma.sessionRating.count({ where: { raterId: session.user.id } }),
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
      orderBy: { scheduledAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ratings & Trust"
        description="Private session ratings feed your public TrustScore tier. Strikes stay separate."
      />
      <RatingsTrustPanel
        role="MENTEE"
        tier={trustScore?.tier ?? "EMERGING"}
        strikeCount={strikeCount}
        ratedCount={ratedCount}
        pendingSessions={pendingSessions.map((s) => ({
          sessionId: s.id,
          counterpartName: s.mentorship.mentor.profile
            ? `${s.mentorship.mentor.profile.firstName} ${s.mentorship.mentor.profile.lastName}`
            : "Mentor",
          outcome: s.outcome,
          scheduledAt: s.scheduledAt,
        }))}
      />
    </div>
  );
}
