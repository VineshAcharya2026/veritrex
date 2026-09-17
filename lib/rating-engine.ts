import type { Role, TrustTier, StrikeReason } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { countVerifiedEndorsements } from "@/lib/endorsements";
import {
  MENTEE_RATES_MENTOR_WEIGHTS,
  MENTOR_RATES_MENTEE_WEIGHTS,
  computeWeightedSessionScore,
  type MenteeRatesMentorInput,
  type MentorRatesMenteeInput,
} from "@/lib/rating-questionnaire";

// ---------------------------------------------------------------------------
// Weighted dimension formulas (VERITREX Step A)
// ---------------------------------------------------------------------------

export function computeMenteeRatesMentorScore(dims: MenteeRatesMentorInput) {
  return computeWeightedSessionScore(dims, MENTEE_RATES_MENTOR_WEIGHTS);
}

export function computeMentorRatesMenteeScore(dims: MentorRatesMenteeInput) {
  return computeWeightedSessionScore(dims, MENTOR_RATES_MENTEE_WEIGHTS);
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

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
/** How long after completion a party may still submit a rating. */
export const RATING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Blind period ends when both parties submitted or 24h passed since completion. */
export function isRatingPeriodClosed(session: {
  completedAt: Date | string | null;
  ratings?: { id: string }[] | null;
}): boolean {
  const bothSubmitted = (session.ratings?.length ?? 0) >= 2;
  const completedAt = parseDate(session.completedAt);
  const twentyFourHoursAgo = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
  const sessionOldEnough = !!completedAt && completedAt <= twentyFourHoursAgo;
  return bothSubmitted || sessionOldEnough;
}

/** Submissions accepted for 7 days after the session is marked COMPLETED. */
export function isRatingWindowOpen(completedAt: Date | string | null): boolean {
  const completed = parseDate(completedAt);
  if (!completed) return false;
  return Date.now() - completed.getTime() <= RATING_WINDOW_MS;
}

/**
 * Pending feedback query: past/due sessions needing outcome, or completed
 * sessions still inside the rating window that this user hasn't rated.
 */
export function pendingFeedbackWhere(userId: string) {
  const now = new Date();
  const windowStart = new Date(Date.now() - RATING_WINDOW_MS);
  return {
    OR: [
      { outcome: null, scheduledAt: { lte: now } },
      {
        outcome: "COMPLETED" as const,
        completedAt: { gte: windowStart },
        ratings: { none: { raterId: userId } },
      },
    ],
  };
}

async function ratingCountsBySessionIds(sessionIds: string[]) {
  const counts = new Map<string, number>();
  if (sessionIds.length === 0) return counts;
  const rows = await prisma.sessionRating.findMany({
    where: { sessionId: { in: sessionIds } },
    select: { id: true, sessionId: true },
  });
  for (const row of rows) {
    counts.set(row.sessionId, (counts.get(row.sessionId) ?? 0) + 1);
  }
  return counts;
}

function attachSessionRatingStubs(
  completedAt: Date | string | null,
  count: number
) {
  return {
    completedAt,
    ratings: Array.from({ length: count }, (_, i) => ({ id: `stub-${i}` })),
  };
}

export async function computeCorrectedAverage(userId: string) {
  const ratings = await prisma.sessionRating.findMany({
    where: { ratedUserId: userId },
    select: {
      weightedScore: true,
      isUnilateral: true,
      raterId: true,
      sessionId: true,
    },
  });

  const sessionIds = [...new Set<string>(ratings.map((r: { sessionId: string }) => r.sessionId))];
  const sessions: { id: string; completedAt: string | null }[] = sessionIds.length
    ? await prisma.mentorshipSession.findMany({
        where: { id: { in: sessionIds } },
        select: { id: true, completedAt: true },
      })
    : [];
  const sessionById = new Map(sessions.map((s) => [s.id, s] as const));
  const counts = await ratingCountsBySessionIds(sessionIds);

  const closedRatings = ratings.filter((r) => {
    const session = sessionById.get(r.sessionId);
    return isRatingPeriodClosed(
      attachSessionRatingStubs(session?.completedAt ?? null, counts.get(r.sessionId) ?? 0)
    );
  });

  if (closedRatings.length === 0) return { average: 0, count: 0, corrected: 0 };

  const platformAvg = await getGlobalAverageScore();

  let weightedSum = 0;
  let totalWeight = 0;

  for (const r of closedRatings) {
    const raterTier = await getRaterTier(r.raterId);
    let weight = TIER_RATER_WEIGHT[raterTier];
    const ratingCount = counts.get(r.sessionId) ?? 0;
    // Unilateral only when the session still has a single rating (ignore stale flags)
    const unilateral = ratingCount < 2;
    if (unilateral) weight *= UNILATERAL_WEIGHT;
    weightedSum += r.weightedScore * weight;
    totalWeight += weight;
  }

  const userAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const effectiveCount = closedRatings.length;

  // Step 3: (5 × platform_avg + n × own_avg) / (5 + n)
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
  const ratings = await prisma.sessionRating.findMany({
    select: {
      weightedScore: true,
      sessionId: true,
    },
  });

  const sessionIds = [...new Set<string>(ratings.map((r: { sessionId: string }) => r.sessionId))];
  const sessions: { id: string; completedAt: string | null }[] = sessionIds.length
    ? await prisma.mentorshipSession.findMany({
        where: { id: { in: sessionIds } },
        select: { id: true, completedAt: true },
      })
    : [];
  const sessionById = new Map(sessions.map((s) => [s.id, s] as const));
  const counts = await ratingCountsBySessionIds(sessionIds);

  const closed = ratings.filter((r) => {
    const session = sessionById.get(r.sessionId);
    return isRatingPeriodClosed(
      attachSessionRatingStubs(session?.completedAt ?? null, counts.get(r.sessionId) ?? 0)
    );
  });
  if (closed.length === 0) return 3.5;

  const sum = closed.reduce((acc, r) => acc + r.weightedScore, 0);
  return sum / closed.length;
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
  // 0–40 Grey, 41–70 Blue, 71–85 Teal, 86–100 Gold
  if (score >= 86) return "DISTINGUISHED";
  if (score >= 71) return "RECOGNISED";
  if (score >= 41) return "ESTABLISHED";
  return "EMERGING";
}

export async function computeTrustScore(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, profile: true },
  });
  if (!user) throw new Error("User not found");

  // 1. Verification (25%): profile + avatar stands in for ID verification
  const hasProfile = !!user.profile;
  const hasAvatar = !!user.profile?.avatar;
  const verificationScore = hasProfile ? (hasAvatar ? 100 : 50) : 0;

  // 2. Rating (25%): Step 3 corrected average mapped 0–5 → 0–100
  const { corrected, count } = await computeCorrectedAverage(userId);
  const ratingScore = count > 0 ? (corrected / 5) * 100 : 0;

  // 3. Activity (20%): completed sessions in last 90 days
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentSessions = await prisma.mentorshipSession.count({
    where: {
      outcome: "COMPLETED",
      completedAt: { gte: ninetyDaysAgo },
      mentorship: {
        OR: [{ mentorId: userId }, { menteeId: userId }],
      },
    },
  });
  const activityScore = Math.min(recentSessions * 10, 100);

  // 4. Outcomes (20%): verified real outcomes (hire / referral stuck, etc.)
  const verifiedOutcomes = await prisma.mentorshipOutcome.count({
    where: { mentorId: userId, verified: true },
  });
  const outcomeScore = Math.min(verifiedOutcomes * 20, 100);

  // 5. Endorsements (10%): verified users who endorsed this profile
  const verifiedEndorsementCount = await countVerifiedEndorsements(userId);
  const endorsementScore = Math.min(verifiedEndorsementCount * 10, 100);

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
      m."mentorId" AS mentor_id,
      m."menteeId" AS mentee_id,
      AVG(sr."weightedScore") AS pair_avg,
      COUNT(sr.id) AS session_count
    FROM "SessionRating" sr
    JOIN "MentorshipSession" ms ON sr."sessionId" = ms.id
    JOIN "Mentorship" m ON ms."mentorshipId" = m.id
    WHERE sr."isUnilateral" = 0
    GROUP BY m."mentorId", m."menteeId"
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
  const { eligible } = await getCashOutEligibility(mentorUserId);
  return eligible;
}

export async function getCashOutEligibility(mentorUserId: string) {
  const flaggedPairs = await prisma.cheatFlag.findMany({
    where: { mentorUserId, reviewed: false },
    select: { menteeUserId: true },
  });
  const flaggedMenteeIds = new Set(flaggedPairs.map((f) => f.menteeUserId));

  const sessions = await prisma.mentorshipSession.findMany({
    where: {
      outcome: "COMPLETED",
      mentorship: { mentorId: mentorUserId },
      ratings: { some: { ratedUserId: mentorUserId, isUnilateral: false } },
    },
    include: {
      ratings: { select: { id: true, isUnilateral: true, ratedUserId: true } },
      mentorship: { select: { menteeId: true } },
    },
  });

  let realSessions = 0;
  for (const s of sessions) {
    if (flaggedMenteeIds.has(s.mentorship.menteeId)) continue;
    if (!isRatingPeriodClosed(s)) continue;
    const mentorRatings = s.ratings.filter(
      (r) => r.ratedUserId === mentorUserId && !r.isUnilateral
    );
    if (mentorRatings.length === 0) continue;
    // Bilateral: both parties rated (non-unilateral mentor rating in closed period)
    if (s.ratings.length >= 2) realSessions++;
  }

  const requiredSessions = 5;

  return {
    eligible: realSessions >= requiredSessions && flaggedPairs.length === 0,
    realSessions,
    requiredSessions,
    hasOpenFlags: flaggedPairs.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Mark unilateral ratings (24h rule)
// ---------------------------------------------------------------------------

export async function markUnilateralRatings() {
  const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

  const sessions = await prisma.mentorshipSession.findMany({
    where: {
      outcome: "COMPLETED",
      completedAt: { lte: cutoff },
      ratings: { some: {} },
    },
    include: {
      ratings: { select: { id: true, isUnilateral: true, ratedUserId: true, raterId: true } },
    },
  });

  let updated = 0;
  for (const session of sessions) {
    if (session.ratings.length === 1 && !session.ratings[0].isUnilateral) {
      await prisma.sessionRating.update({
        where: { id: session.ratings[0].id },
        data: { isUnilateral: true },
      });
      await evaluateTierChange(session.ratings[0].ratedUserId);
      await evaluateTierChange(session.ratings[0].raterId);
      updated++;
      continue;
    }

    // Clear stale unilateral flags once both parties have rated
    if (session.ratings.length >= 2) {
      const stale = session.ratings.filter((r) => r.isUnilateral);
      for (const r of stale) {
        await prisma.sessionRating.update({
          where: { id: r.id },
          data: { isUnilateral: false },
        });
        updated++;
      }
      if (stale.length > 0) {
        const seen = new Set<string>();
        for (const r of session.ratings) {
          if (!seen.has(r.ratedUserId)) {
            seen.add(r.ratedUserId);
            await evaluateTierChange(r.ratedUserId);
          }
          if (!seen.has(r.raterId)) {
            seen.add(r.raterId);
            await evaluateTierChange(r.raterId);
          }
        }
      }
    }
  }

  return updated;
}

/** After a rating is saved: clear/set unilateral flags and refresh TrustScores when the period is closed. */
export async function finalizeSessionRatings(
  sessionId: string,
  completedAt: Date | string | null,
  partyUserIds: [string, string]
) {
  const ratings = await prisma.sessionRating.findMany({
    where: { sessionId },
    select: { id: true, isUnilateral: true },
  });

  if (ratings.length >= 2) {
    const stale = ratings.filter((r) => r.isUnilateral);
    for (const r of stale) {
      await prisma.sessionRating.update({
        where: { id: r.id },
        data: { isUnilateral: false },
      });
    }
  } else if (
    ratings.length === 1 &&
    isRatingPeriodClosed({ completedAt, ratings })
  ) {
    if (!ratings[0].isUnilateral) {
      await prisma.sessionRating.update({
        where: { id: ratings[0].id },
        data: { isUnilateral: true },
      });
    }
  }

  if (isRatingPeriodClosed({ completedAt, ratings })) {
    await evaluateTierChange(partyUserIds[0]);
    await evaluateTierChange(partyUserIds[1]);
  }
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
