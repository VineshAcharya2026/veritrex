import type { NationBuildingBadge, NationBuildingCategory } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { getMentorImpact, type MentorImpact, type SectionSummary } from "@/lib/nation-building-impact";

const NATION_BUILDER_SCORE_THRESHOLD = 500;

function section(
  sections: SectionSummary[],
  category: NationBuildingCategory
): SectionSummary {
  return (
    sections.find((s) => s.category === category) ?? {
      category,
      verifiedCount: 0,
      verifiedQuantity: 0,
      pendingCount: 0,
    }
  );
}

/** Returns the set of badges a mentor currently qualifies for, given their impact. */
export function earnedBadgesFor(impact: MentorImpact): NationBuildingBadge[] {
  const { kpis, composite, sections } = impact;
  const communityService = section(sections, "COMMUNITY_SERVICE");
  const masterclasses = section(sections, "MASTERCLASSES");
  const startups = section(sections, "STARTUP_SUCCESS");

  const earned = new Set<NationBuildingBadge>();

  if (kpis.volunteerHours >= 20 || communityService.verifiedCount >= 3) {
    earned.add("COMMUNITY_MENTOR");
  }
  if (kpis.careersTransformed >= 5) earned.add("CAREER_CATALYST");
  if (startups.verifiedCount >= 2) earned.add("STARTUP_ENABLER");
  if (masterclasses.verifiedQuantity >= 3) earned.add("EDUCATION_CHAMPION");
  if (kpis.opportunitiesCreated >= 5) earned.add("OPPORTUNITY_CREATOR");

  const others: NationBuildingBadge[] = [
    "COMMUNITY_MENTOR",
    "CAREER_CATALYST",
    "STARTUP_ENABLER",
    "EDUCATION_CHAMPION",
    "OPPORTUNITY_CREATOR",
  ];
  if (composite >= NATION_BUILDER_SCORE_THRESHOLD || others.every((b) => earned.has(b))) {
    earned.add("NATION_BUILDER");
  }

  return [...earned];
}

/**
 * Reconcile stored badges with what the mentor currently qualifies for. Awards
 * newly earned badges and removes any that no longer apply after verification
 * changes. Called after admin verify/reject and score recalculation.
 */
export async function recalculateNationBuildingBadges(mentorUserId: string) {
  const impact = await getMentorImpact(mentorUserId);
  const earned = new Set(earnedBadgesFor(impact));

  const existing: { badge: NationBuildingBadge }[] =
    await prisma.mentorNationBuildingBadge.findMany({
      where: { mentorId: mentorUserId },
      select: { badge: true },
    });
  const existingSet = new Set(existing.map((b) => b.badge));

  const toAdd = [...earned].filter((b) => !existingSet.has(b));
  const toRemove = [...existingSet].filter((b) => !earned.has(b));

  for (const badge of toAdd) {
    await prisma.mentorNationBuildingBadge.upsert({
      where: { mentorId_badge: { mentorId: mentorUserId, badge } },
      create: { mentorId: mentorUserId, badge },
      update: {},
    });
  }
  if (toRemove.length > 0) {
    await prisma.mentorNationBuildingBadge.deleteMany({
      where: { mentorId: mentorUserId, badge: { in: toRemove } },
    });
  }

  return [...earned];
}
