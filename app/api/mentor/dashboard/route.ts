import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLifetimeCredits } from "@/lib/credits";
import { getMentorImpact } from "@/lib/nation-building-impact";
import {
  getStrikeCount,
  getCashOutEligibility,
  pendingFeedbackWhere,
} from "@/lib/rating-engine";

export async function GET() {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const mentorUserId = session.user.id;

  const [
    profile,
    credits,
    impact,
    activeMentees,
    pendingRequests,
    trustScore,
    strikeCount,
    pendingSessions,
    cashOutEligibility,
    userProfile,
    activeMentorships,
  ] = await Promise.all([
    prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
      include: {
        skills: { orderBy: { masteryLevel: "desc" }, take: 5 },
        _count: { select: { content: true } },
      },
    }),
    getLifetimeCredits(mentorUserId),
    getMentorImpact(mentorUserId),
    prisma.mentorship.count({ where: { mentorId: mentorUserId, status: "ACTIVE" } }),
    prisma.mentorship.count({ where: { mentorId: mentorUserId, status: "PENDING" } }),
    prisma.trustScoreRecord.findUnique({ where: { userId: mentorUserId } }),
    getStrikeCount(mentorUserId),
    prisma.mentorshipSession.findMany({
      where: {
        mentorship: { mentorId: mentorUserId },
        ...pendingFeedbackWhere(mentorUserId),
      },
      include: {
        mentorship: {
          include: { mentee: { include: { profile: true } } },
        },
      },
      orderBy: { completedAt: "desc" },
    }),
    getCashOutEligibility(mentorUserId),
    prisma.profile.findUnique({ where: { userId: mentorUserId } }),
    prisma.mentorship.findMany({
      where: { mentorId: mentorUserId, status: "ACTIVE" },
      include: {
        mentee: {
          include: {
            profile: true,
            menteeProfile: true,
            trustScore: { select: { tier: true } },
          },
        },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
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
          title: profile.title,
          company: profile.company,
          headline: profile.professionalHeadline,
          city: profile.city,
          industry: profile.industry,
          expertise: profile.expertise,
        }
      : null,
    selfCard: {
      userId: mentorUserId,
      name: userProfile
        ? `${userProfile.firstName} ${userProfile.lastName}`
        : session.user.name || "Mentor",
      avatar: userProfile?.avatar ?? null,
      title: profile?.title ?? null,
      company: profile?.company ?? null,
      headline: profile?.professionalHeadline ?? null,
      city: profile?.city ?? null,
      industry: profile?.industry ?? null,
      expertise: profile?.expertise ?? [],
      tier: trustScore?.tier ?? "EMERGING",
      isEliteFounder100: profile?.isEliteFounder100 ?? false,
    },
    menteeCards: activeMentorships.map((m) => ({
      userId: m.menteeId,
      name: m.mentee.profile
        ? `${m.mentee.profile.firstName} ${m.mentee.profile.lastName}`
        : "Mentee",
      avatar: m.mentee.profile?.avatar ?? null,
      currentRole: m.mentee.menteeProfile?.currentRole ?? null,
      currentStatus: m.mentee.menteeProfile?.currentStatus ?? null,
      careerGoal: m.mentee.menteeProfile?.careerGoal ?? null,
      goals: m.mentee.menteeProfile?.goals ?? null,
      skills: m.mentee.menteeProfile?.desiredSkills ?? [],
      tier: m.mentee.trustScore?.tier ?? "EMERGING",
    })),
    credits,
    cashOutEligibility,
    trustScore: trustScore
      ? { tier: trustScore.tier }
      : { tier: "EMERGING" },
    strikeCount,
    nationBuilding: { kpis: impact.kpis, composite: impact.composite },
    activeMentees,
    pendingRequests,
    pendingSessions: pendingSessions.map((s) => ({
      sessionId: s.id,
      menteeName: s.mentorship.mentee.profile
        ? `${s.mentorship.mentee.profile.firstName} ${s.mentorship.mentee.profile.lastName}`
        : "Mentee",
      completedAt: s.completedAt,
      outcome: s.outcome,
    })),
  });
}
