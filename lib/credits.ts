import type { CreditType } from "@/lib/db/types";
import type { DbClient } from "@/lib/db/orm";
import { prisma } from "@/lib/prisma";
import { recalculateThoughtLeadershipScore } from "@/lib/mentor-scores";
import { getCashOutEligibility } from "@/lib/rating-engine";

export class CashOutNotEligibleError extends Error {
  constructor(
    message: string,
    public readonly details: {
      realSessions: number;
      requiredSessions: number;
      hasOpenFlags: boolean;
    }
  ) {
    super(message);
    this.name = "CashOutNotEligibleError";
  }
}

/** Call before any future credit redemption / payout API. */
export async function assertCashOutEligible(mentorUserId: string) {
  const eligibility = await getCashOutEligibility(mentorUserId);
  if (!eligibility.eligible) {
    const message = eligibility.hasOpenFlags
      ? "Credit cash-out is paused while a rating review is open on your account."
      : `Complete ${eligibility.requiredSessions - eligibility.realSessions} more bilateral, unflagged rated sessions to unlock cash-out.`;
    throw new CashOutNotEligibleError(message, {
      realSessions: eligibility.realSessions,
      requiredSessions: eligibility.requiredSessions,
      hasOpenFlags: eligibility.hasOpenFlags,
    });
  }
  return eligibility;
}

export const CREDIT_AMOUNTS = {
  MENTORSHIP_COMPLETED: 10,
  RATING_5_STAR: 5,
  RATING_4_STAR: 3,
  NATION_BUILDING_OUTCOME: 20,
  FREE_MENTORSHIP: 15,
  CONTENT_PUBLISHED: 2,
} as const;

type Tx = DbClient;

async function getMentorProfileId(mentorUserId: string, tx: Tx = prisma) {
  const profile = await tx.mentorProfile.findUnique({
    where: { userId: mentorUserId },
    select: { id: true },
  });
  if (!profile) throw new Error("Mentor profile not found");
  return profile.id;
}

export async function awardCredits(
  mentorUserId: string,
  amount: number,
  type: CreditType,
  reason: string,
  mentorshipId?: string,
  tx: Tx = prisma
) {
  const mentorId = await getMentorProfileId(mentorUserId, tx);

  await tx.creditLedger.create({
    data: { mentorId, amount, type, reason, mentorshipId },
  });

  await tx.mentorProfile.update({
    where: { id: mentorId },
    data: { creditsBalance: { increment: amount } },
  });
}

export async function awardCreditsAndRecalculate(
  mentorUserId: string,
  amount: number,
  type: CreditType,
  reason: string,
  mentorshipId?: string
) {
  await prisma.$transaction(async (tx) => {
    await awardCredits(mentorUserId, amount, type, reason, mentorshipId, tx);
  });
  await recalculateThoughtLeadershipScore(mentorUserId);
}

export async function getLifetimeCredits(mentorUserId: string) {
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUserId },
    select: { id: true, creditsBalance: true },
  });
  if (!profile) return { balance: 0, lifetime: 0 };

  const agg = await prisma.creditLedger.aggregate({
    where: { mentorId: profile.id, amount: { gt: 0 } },
    _sum: { amount: true },
  });

  return {
    balance: profile.creditsBalance,
    lifetime: agg._sum.amount ?? 0,
  };
}

export function ratingCreditAmount(rating: number) {
  if (rating === 5) return CREDIT_AMOUNTS.RATING_5_STAR;
  if (rating === 4) return CREDIT_AMOUNTS.RATING_4_STAR;
  return 0;
}
