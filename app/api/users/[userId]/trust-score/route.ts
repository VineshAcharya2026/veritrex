import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  EMERGING: { label: "Emerging", color: "grey" },
  ESTABLISHED: { label: "Established", color: "blue" },
  RECOGNISED: { label: "Recognised", color: "teal" },
  DISTINGUISHED: { label: "Distinguished", color: "gold" },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const record = await prisma.trustScoreRecord.findUnique({
    where: { userId },
  });

  if (!record) {
    return NextResponse.json({
      tier: "EMERGING",
      tierLabel: "Emerging",
      badgeColor: "grey",
      totalScore: 0,
    });
  }

  const info = TIER_LABELS[record.tier] ?? TIER_LABELS.EMERGING;

  return NextResponse.json({
    tier: record.tier,
    tierLabel: info.label,
    badgeColor: info.color,
    totalScore: record.totalScore,
  });
}
