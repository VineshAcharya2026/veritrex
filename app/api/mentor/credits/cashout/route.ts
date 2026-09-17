import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertCashOutEligible, CashOutNotEligibleError } from "@/lib/credits";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/utils";
import { getCashOutEligibility } from "@/lib/rating-engine";

export async function GET() {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const eligibility = await getCashOutEligibility(session.user.id);
  return NextResponse.json(eligibility);
}

export async function POST(request: Request) {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  try {
    await assertCashOutEligible(session.user.id);
  } catch (e) {
    if (e instanceof CashOutNotEligibleError) {
      return NextResponse.json({ error: e.message, ...e.details }, { status: 403 });
    }
    throw e;
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, creditsBalance: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
  }
  if (profile.creditsBalance <= 0) {
    return NextResponse.json({ error: "No credits available to cash out" }, { status: 400 });
  }

  const amount = profile.creditsBalance;

  await prisma.$transaction(async (tx) => {
    await tx.creditLedger.create({
      data: {
        mentorId: profile.id,
        amount: -amount,
        type: "ADMIN_ADJUSTMENT",
        reason: "Credits cashed out",
      },
    });
    await tx.mentorProfile.update({
      where: { id: profile.id },
      data: { creditsBalance: 0 },
    });
  });

  await logAudit({
    userId: session.user.id,
    action: "CREDITS_CASHED_OUT",
    entity: "MentorProfile",
    entityId: profile.id,
    ipAddress: getClientIp(request),
    metadata: { amount },
  });

  return NextResponse.json({ cashedOut: amount });
}
