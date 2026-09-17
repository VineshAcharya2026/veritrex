import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardCreditsAndRecalculate, CREDIT_AMOUNTS } from "@/lib/credits";
import { recalculateThoughtLeadershipScore } from "@/lib/mentor-scores";
import { syncPlatformNationBuildingEntries } from "@/lib/nation-building-sync";
import { recalculateNationBuildingBadges } from "@/lib/nation-building-badges";

const schema = z.object({
  verified: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.mentorshipOutcome.findUnique({
    where: { id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const outcome = await prisma.mentorshipOutcome.update({
    where: { id },
    data: { verified: parsed.data.verified },
  });

  if (parsed.data.verified && !existing.verified) {
    await awardCreditsAndRecalculate(
      existing.mentorId,
      CREDIT_AMOUNTS.NATION_BUILDING_OUTCOME,
      "NATION_BUILDING_OUTCOME",
      `Verified outcome: ${existing.outcomeType}`,
      existing.mentorshipId
    );
  } else {
    await recalculateThoughtLeadershipScore(existing.mentorId);
  }

  // Mirror the verified outcome into the nation-building impact system.
  await syncPlatformNationBuildingEntries(existing.mentorId);
  await recalculateNationBuildingBadges(existing.mentorId);

  return NextResponse.json(outcome);
}
