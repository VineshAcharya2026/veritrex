import type { Role, TrustTier, StrikeReason, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Weighted dimension formulas
// ---------------------------------------------------------------------------

const MENTEE_RATES_MENTOR_WEIGHTS = {
  knowledge: 0.3,
  actionability: 0.25,
  preparation: 0.2,
  clarity: 0.15,
  responsiveness: 0.1,
} as const;

const MENTOR_RATES_MENTEE_WEIGHTS = {
  goalClarity: 0.3,
  menteePreparation: 0.25,
  engagement: 0.25,
  followThrough: 0.2,
} as const;

export function computeMenteeRatesMentorScore(dims: {
  knowledge: number;
  actionability: number;
  preparation: number;
  clarity: number;
  responsiveness: number;
}) {
  return (
    dims.knowledge * MENTEE_RATES_MENTOR_WEIGHTS.knowledge +
    dims.actionability * MENTEE_RATES_MENTOR_WEIGHTS.actionability +
    dims.preparation * MENTEE_RATES_MENTOR_WEIGHTS.preparation +
    dims.clarity * MENTEE_RATES_MENTOR_WEIGHTS.clarity +
    dims.responsiveness * MENTEE_RATES_MENTOR_WEIGHTS.responsiveness
  );
}

export function computeMentorRatesMenteeScore(dims: {
  goalClarity: number;
  menteePreparation: number;
  engagement: number;
  followThrough: number;
}) {
  return (
    dims.goalClarity * MENTOR_RATES_MENTEE_WEIGHTS.goalClarity +
    dims.menteePreparation * MENTOR_RATES_MENTEE_WEIGHTS.menteePreparation +
    dims.engagement * MENTOR_RATES_MENTEE_WEIGHTS.engagement +
    dims.followThrough * MENTOR_RATES_MENTEE_WEIGHTS.followThrough
  );
}

// ---------------------------------------------------------------------------
// Rater-weight multipliers based on rater's TrustScore tier
// ---------------------------------------------------------------------------

const TIER_RATER_WEIGHT: Record<TrustTier, number> = {
  EMERGING: 0.7,
  ESTABLISHED: 1.0,
  RECOGNISED: 1.15,
  DISTINGUISHED: 1.3,
};

const UNILATERAL_WEIGHT = 0.6;

async function getRaterTier(userId: string): Promise<TrustTier> {
  const record = await prisma.trustScoreRecord.findUnique({
    where: { userId },
    select: { tier: true },
  });
  return record?.tier ?? "EMERGING";
}

// ---------------------------------------------------------------------------
// Corrected rating average (Bayesian blending + rater weights)
// ---------------------------------------------------------------------------

const PRIOR_STRENGTH = 5;

export async function computeCorrectedAverage(userId: string) {
  const ratings = await prisma.sessionRating.findMany({
    where: { ratedUserId: userId },
    select: {
      weightedScore: true,
      isUnilateral: true,
      raterId: true,
    },
  });

  if (ratings.length === 0) return { average: 0, count: 0, corrected: 0 };

  const platformAvg = await getGlobalAverageScore();

  let weightedSum = 0;
  let totalWeight = 0;

  for (const r of ratings) {
    const raterTier = await getRaterTier(r.raterId);
    let weight = TIER_RATER_WEIGHT[raterTier];
    if (r.isUnilateral) weight *= UNILATERAL_WEIGHT;
    weightedSum += r.weightedScore * weight;
    totalWeight += weight;
  }

  const userAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const effectiveCount = ratings.length;

  const corrected =
    (PRIOR_STRENGTH * platformAvg + effectiveCount * userAvg) /
    (PRIOR_STRENGTH + effectiveCount);

  return {
    average: userAvg,
    count: effectiveCount,
    corrected: Math.round(corrected * 100) / 100,
  };
}

async function getGlobalAverageScore(): Promise<number> {
  const agg = await prisma.sessionRating.aggregate({
    _avg: { weightedScore: true },
  });
  return agg._avg.weightedScore ?? 3.5;
}

// ---------------------------------------------------------------------------
// TrustScore computation (5 ingredients)
// ---------------------------------------------------------------------------

const TRUST_WEIGHTS = {
  verification: 0.25,
  rating: 0.25,
  activity: 0.2,
  outcomes: 0.2,
  endorsements: 0.1,
} as const;

function tierFromScore(score: number): TrustTier {
  if (score >= 86) return "DISTINGUISHED";
  if (score >= 71) return "RECOGNISED";
  if (score >= 41) return "ESTABLISHED";
  return "EMERGING";
}

function tierFloor(tier: TrustTier): number {
  switch (tier) {
    case "DISTINGUISHED": return 86;
    case "RECOGNISED": return 71;
    case "ESTABLISHED": return 41;
    case "EMERGING": return 0;
  }
}

export async function computeTrustScore(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, profile: true },
  });
  if (!user) throw new Error("User not found");

  // 1. Verification score (0-100): has profile + avatar = verified
  const hasProfile = !!user.profile;
  const hasAvatar = !!user.profile?.avatar;
  const verificationScore = hasProfile ? (hasAvatar ? 100 : 50) : 0;

  // 2. Rating score (0-100): corrected average mapped from 0-5 to 0-100
  const { corrected, count } = await computeCorrectedAverage(userId);
  const ratingScore = count > 0 ? (corrected / 5) * 100 : 0;

  // 3. Activity score (0-100): sessions in last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentSessions = await prisma.sessionRating.count({
    where: {
      OR: [{ raterId: userId }, { ratedUserId: userId }],
      createdAt: { gte: ninetyDaysAgo },
    },
  });
  const activityScore = Math.min(recentSessions * 10, 100);

  // 4. Outcome score (0-100): verified outcomes
  const verifiedOutcomes = await prisma.mentorshipOutcome.count({
    where: { mentorId: userId, verified: true },
  });
  const outcomeScore = Math.min(verifiedOutcomes * 20, 100);

  // 5. Endorsement score (placeholder — count of unique raters as proxy)
  const uniqueRaters = await prisma.sessionRating.findMany({
    where: { ratedUserId: userId },
    distinct: ["raterId"],
    select: { raterId: true },
  });
  const endorsementScore = Math.min(uniqueRaters.length * 10, 100);

  const totalScore = Math.round(
    verificationScore * TRUST_WEIGHTS.verification +
    ratingScore * TRUST_WEIGHTS.rating +
    activityScore * TRUST_WEIGHTS.activity +
    outcomeScore * TRUST_WEIGHTS.outcomes +
    endorsementScore * TRUST_WEIGHTS.endorsements
  );

  const newTier = tierFromScore(totalScore);

  return {
    verificationScore,
    ratingScore: Math.round(ratingScore),
    activityScore,
    outcomeScore,
    endorsementScore,
    totalScore,
    tier: newTier,
  };
}

// ---------------------------------------------------------------------------
// Tier promotion / demotion logic
// ---------------------------------------------------------------------------

export async function evaluateTierChange(userId: string) {
  const scores = await computeTrustScore(userId);
  const existing = await prisma.trustScoreRecord.findUnique({
    where: { userId },
  });

  const newTier = scores.tier;
  const currentTier = existing?.tier ?? "EMERGING";

  let tierPromotionCycles = existing?.tierPromotionCycles ?? 0;
  let tierDemotionWarned = existing?.tierDemotionWarned ?? false;
  let finalTier = currentTier;

  const tierOrder: TrustTier[] = ["EMERGING", "ESTABLISHED", "RECOGNISED", "DISTINGUISHED"];
  const newIdx = tierOrder.indexOf(newTier);
  const curIdx = tierOrder.indexOf(currentTier);

  if (newIdx > curIdx) {
    tierPromotionCycles += 1;
    if (tierPromotionCycles >= 2) {
      finalTier = newTier;
      tierPromotionCycles = 0;
    }
    tierDemotionWarned = false;
  } else if (newIdx < curIdx) {
    if (!tierDemotionWarned) {
      tierDemotionWarned = true;
      finalTier = currentTier;
    } else {
      finalTier = newTier;
      tierDemotionWarned = false;
      tierPromotionCycles = 0;
    }
  } else {
    if (newIdx === curIdx) tierPromotionCycles = 0;
    tierDemotionWarned = false;
  }

  await prisma.trustScoreRecord.upsert({
    where: { userId },
    create: {
      userId,
      ...scores,
      tier: finalTier,
      tierPromotionCycles,
      tierDemotionWarned,
    },
    update: {
      ...scores,
      tier: finalTier,
      tierPromotionCycles,
      tierDemotionWarned,
    },
  });

  return { ...scores, tier: finalTier };
}

// ---------------------------------------------------------------------------
// Strike management
// ---------------------------------------------------------------------------

export async function addStrike(
  userId: string,
  sessionId: string,
  reason: StrikeReason
) {
  await prisma.reliabilityStrike.create({
    data: { userId, sessionId, reason },
  });

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const count = await prisma.reliabilityStrike.count({
    where: { userId, createdAt: { gte: ninetyDaysAgo } },
  });

  if (count >= 3) {
    await prisma.notification.create({
      data: {
        userId,
        message: `Your account has been flagged for review due to ${count} reliability strikes in the last 90 days.`,
        type: "STRIKE_WARNING",
      },
    });
  }

  return count;
}

export async function getStrikeCount(userId: string) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  return prisma.reliabilityStrike.count({
    where: { userId, createdAt: { gte: ninetyDaysAgo } },
  });
}

// ---------------------------------------------------------------------------
// Cheating detection
// ---------------------------------------------------------------------------

export async function detectSuspiciousPairs() {
  const pairs = await prisma.$queryRaw<
    {
      mentor_id: string;
      mentee_id: string;
      pair_avg: number;
      session_count: number;
    }[]
  >`
    SELECT
      ms."mentorshipId" AS mentorship_id,
      m."mentorId" AS mentor_id,
      m."menteeId" AS mentee_id,
      AVG(sr."weightedScore") AS pair_avg,
      COUNT(sr.id)::int AS session_count
    FROM "SessionRating" sr
    JOIN "MentorshipSession" ms ON sr."sessionId" = ms.id
    JOIN "Mentorship" m ON ms."mentorshipId" = m.id
    WHERE sr."isUnilateral" = false
    GROUP BY m."mentorId", m."menteeId", ms."mentorshipId"
    HAVING AVG(sr."weightedScore") >= 4.8 AND COUNT(sr.id) >= 6
  `;

  const flags: { mentorUserId: string; menteeUserId: string; pairAvg: number; sessionCount: number }[] = [];

  for (const pair of pairs) {
    const othersAvg = await prisma.sessionRating.aggregate({
      where: {
        ratedUserId: pair.mentor_id,
        raterId: { not: pair.mentee_id },
      },
      _avg: { weightedScore: true },
    });

    const diff = pair.pair_avg - (othersAvg._avg.weightedScore ?? pair.pair_avg);
    if (diff > 0.8) {
      const existing = await prisma.cheatFlag.findFirst({
        where: {
          mentorUserId: pair.mentor_id,
          menteeUserId: pair.mentee_id,
          reviewed: false,
        },
      });

      if (!existing) {
        await prisma.cheatFlag.create({
          data: {
            mentorUserId: pair.mentor_id,
            menteeUserId: pair.mentee_id,
            reason: `Pair avg ${pair.pair_avg.toFixed(2)} vs others avg ${(othersAvg._avg.weightedScore ?? 0).toFixed(2)} across ${pair.session_count} sessions`,
            pairAvgScore: pair.pair_avg,
            othersAvgScore: othersAvg._avg.weightedScore,
            sessionCount: pair.session_count,
          },
        });
        flags.push({
          mentorUserId: pair.mentor_id,
          menteeUserId: pair.mentee_id,
          pairAvg: pair.pair_avg,
          sessionCount: pair.session_count,
        });
      }
    }
  }

  return flags;
}

// ---------------------------------------------------------------------------
// Credit cash-out eligibility (Step 6)
// ---------------------------------------------------------------------------

export async function canCashOutCredits(mentorUserId: string) {
  const realSessions = await prisma.sessionRating.count({
    where: {
      ratedUserId: mentorUserId,
      isUnilateral: false,
      session: {
        mentorship: {
          mentorId: mentorUserId,
        },
      },
    },
  });

  const flaggedPairs = await prisma.cheatFlag.count({
    where: {
      mentorUserId,
      reviewed: false,
    },
  });

  return realSessions >= 5 && flaggedPairs === 0;
}

// ---------------------------------------------------------------------------
// Mark unilateral ratings (24h rule)
// ---------------------------------------------------------------------------

export async function markUnilateralRatings() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const sessions = await prisma.mentorshipSession.findMany({
    where: {
      outcome: "COMPLETED",
      completedAt: { lte: cutoff },
      ratings: { some: {} },
    },
    include: {
      ratings: true,
      mentorship: { select: { mentorId: true, menteeId: true } },
    },
  });

  let updated = 0;
  for (const session of sessions) {
    if (session.ratings.length === 1 && !session.ratings[0].isUnilateral) {
      await prisma.sessionRating.update({
        where: { id: session.ratings[0].id },
        data: { isUnilateral: true },
      });
      updated++;
    }
  }

  return updated;
}

// ---------------------------------------------------------------------------
// Batch recalculate all TrustScores
// ---------------------------------------------------------------------------

export async function batchRecalculateTrustScores() {
  const users = await prisma.user.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  let processed = 0;
  for (const user of users) {
    await evaluateTierChange(user.id);
    processed++;
  }

  return processed;
}
