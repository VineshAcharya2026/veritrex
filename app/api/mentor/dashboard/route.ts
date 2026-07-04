import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLifetimeCredits } from "@/lib/credits";
import { getMentorNationBuildingStats } from "@/lib/mentor-scores";
import { getStrikeCount, computeCorrectedAverage } from "@/lib/rating-engine";

export async function GET() {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const mentorUserId = session.user.id;

  const [
    profile,
    credits,
    nationBuilding,
    activeMentees,
    pendingRequests,
    trustScore,
    strikeCount,
    correctedRating,
    pendingSessions,
  ] = await Promise.all([
    prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
      include: {
        skills: { orderBy: { masteryLevel: "desc" }, take: 5 },
        _count: { select: { content: true } },
      },
    }),
    getLifetimeCredits(mentorUserId),
    getMentorNationBuildingStats(mentorUserId),
    prisma.mentorship.count({ where: { mentorId: mentorUserId, status: "ACTIVE" } }),
    prisma.mentorship.count({ where: { mentorId: mentorUserId, status: "PENDING" } }),
    prisma.trustScoreRecord.findUnique({ where: { userId: mentorUserId } }),
    getStrikeCount(mentorUserId),
    computeCorrectedAverage(mentorUserId),
    prisma.mentorshipSession.findMany({
      where: {
        mentorship: { mentorId: mentorUserId },
        outcome: "COMPLETED",
        ratings: { none: { raterId: mentorUserId } },
      },
      include: {
        mentorship: {
          include: { mentee: { include: { profile: true } } },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    profile: profile
      ? {
          skillsCount: profile.skills.length,
          topSkills: profile.skills,
          isEliteFounder100: profile.isEliteFounder100,
          thoughtLeadershipScore: profile.thoughtLeadershipScore,
          contentCount: profile._count.content,
        }
      : null,
    credits,
    ratings: {
      average: correctedRating.corrected > 0
        ? Math.round(correctedRating.corrected * 10) / 10
        : null,
      count: correctedRating.count,
    },
    trustScore: trustScore
      ? { tier: trustScore.tier, totalScore: trustScore.totalScore }
      : { tier: "EMERGING", totalScore: 0 },
    strikeCount,
    nationBuilding,
    activeMentees,
    pendingRequests,
    pendingSessions: pendingSessions.map((s) => ({
      sessionId: s.id,
      menteeName: s.mentorship.mentee.profile
        ? `${s.mentorship.mentee.profile.firstName} ${s.mentorship.mentee.profile.lastName}`
        : "Mentee",
      completedAt: s.completedAt,
    })),
  });
}
