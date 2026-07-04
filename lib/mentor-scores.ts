import { prisma } from "@/lib/prisma";
import { computeCorrectedAverage } from "@/lib/rating-engine";

export async function recalculateThoughtLeadershipScore(mentorUserId: string) {
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUserId },
    include: {
      content: true,
      creditLedger: { where: { amount: { gt: 0 } } },
    },
  });
  if (!profile) return 0;

  const verifiedOutcomes = await prisma.mentorshipOutcome.count({
    where: { mentorId: mentorUserId, verified: true },
  });

  const { corrected, count } = await computeCorrectedAverage(mentorUserId);
  const ratingScore = count > 0 ? (corrected / 5) * 40 : 0;

  const contentCount = profile.content.length;
  const contentScore = Math.min(contentCount * 4, 20);

  const outcomeScore = Math.min(verifiedOutcomes * 5, 25);

  const lifetimeCredits = profile.creditLedger.reduce((s, e) => s + e.amount, 0);
  const creditScore = Math.min((lifetimeCredits / 100) * 15, 15);

  const score = Math.round(ratingScore + contentScore + outcomeScore + creditScore);

  await prisma.mentorProfile.update({
    where: { id: profile.id },
    data: { thoughtLeadershipScore: score },
  });

  return score;
}

export async function getMentorNationBuildingStats(mentorUserId: string) {
  const [completedMentorships, freeSessions, outcomes] = await Promise.all([
    prisma.mentorship.count({
      where: { mentorId: mentorUserId, status: "COMPLETED" },
    }),
    prisma.mentorship.count({
      where: { mentorId: mentorUserId, status: "COMPLETED", isFreeOrConcessional: true },
    }),
    prisma.mentorshipOutcome.findMany({
      where: { mentorId: mentorUserId, verified: true },
    }),
  ]);

  const placed = outcomes.filter((o) => o.outcomeType === "PLACED").length;
  const promoted = outcomes.filter((o) => o.outcomeType === "PROMOTED").length;
  const startedVenture = outcomes.filter((o) => o.outcomeType === "STARTED_VENTURE").length;
  const industryChangers = outcomes.filter((o) => o.outcomeType === "CHANGED_INDUSTRY").length;
  const jobChangers = outcomes.filter((o) => o.outcomeType === "CHANGED_JOB").length;

  const cities = new Set(outcomes.map((o) => o.city).filter(Boolean));
  const industries = new Set(outcomes.map((o) => o.industry).filter(Boolean));

  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUserId },
    select: { industry: true },
  });
  if (mentorProfile?.industry) industries.add(mentorProfile.industry);

  return {
    professionalsGuided: completedMentorships,
    freeSessions,
    placed,
    promoted,
    startedVenture,
    industryChangers,
    jobChangers,
    careerChangers: industryChangers + jobChangers,
    citiesReached: cities.size,
    industriesCovered: industries.size,
  };
}
