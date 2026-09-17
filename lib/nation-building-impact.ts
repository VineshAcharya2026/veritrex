import type { NationBuildingCategory } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { NATION_BUILDING_CATEGORIES } from "@/lib/nation-building";

export type ImpactKpis = {
  peopleImpacted: number;
  careersTransformed: number;
  opportunitiesCreated: number;
  volunteerHours: number;
};

export type SectionSummary = {
  category: NationBuildingCategory;
  verifiedCount: number;
  verifiedQuantity: number;
  pendingCount: number;
};

export type NationBuildingEntryRow = {
  id: string;
  mentorId: string;
  category: NationBuildingCategory;
  title: string;
  description: string | null;
  quantity: number;
  eventDate: Date | null;
  location: string | null;
  testimonial: string | null;
  evidenceUrls: string[];
  mentorshipId: string | null;
  source: "MANUAL" | "PLATFORM";
  verified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
};

const COMPOSITE_WEIGHTS = {
  peopleImpacted: 1,
  careersTransformed: 5,
  opportunitiesCreated: 8,
  volunteerHours: 0.5,
} as const;

export function computeCompositeScore(kpis: ImpactKpis): number {
  return Math.round(
    kpis.peopleImpacted * COMPOSITE_WEIGHTS.peopleImpacted +
      kpis.careersTransformed * COMPOSITE_WEIGHTS.careersTransformed +
      kpis.opportunitiesCreated * COMPOSITE_WEIGHTS.opportunitiesCreated +
      kpis.volunteerHours * COMPOSITE_WEIGHTS.volunteerHours
  );
}

function sumQuantity(
  entries: NationBuildingEntryRow[],
  categories: NationBuildingCategory[]
): number {
  const set = new Set(categories);
  return entries
    .filter((e) => e.verified && set.has(e.category))
    .reduce((sum, e) => sum + (e.quantity || 0), 0);
}

export function computeKpis(
  entries: NationBuildingEntryRow[],
  freeMentoringMinutes: number
): ImpactKpis {
  const freeMentoringHours = Math.round(freeMentoringMinutes / 60);
  return {
    peopleImpacted: sumQuantity(entries, [
      "FREE_MENTORING",
      "UNDERPRIVILEGED_MENTEES",
      "GROUP_MENTORING",
    ]),
    careersTransformed: sumQuantity(entries, ["CAREER_GROWTH"]),
    opportunitiesCreated: sumQuantity(entries, ["JOBS_REFERRALS", "STARTUP_SUCCESS"]),
    volunteerHours: sumQuantity(entries, ["VOLUNTEER_HOURS"]) + freeMentoringHours,
  };
}

export function buildSectionSummaries(
  entries: NationBuildingEntryRow[]
): SectionSummary[] {
  return NATION_BUILDING_CATEGORIES.map(({ category }) => {
    const inCategory = entries.filter((e) => e.category === category);
    const verified = inCategory.filter((e) => e.verified);
    return {
      category,
      verifiedCount: verified.length,
      verifiedQuantity: verified.reduce((sum, e) => sum + (e.quantity || 0), 0),
      pendingCount: inCategory.length - verified.length,
    };
  });
}

async function getFreeMentoringMinutes(mentorUserId: string): Promise<number> {
  const sessions = await prisma.mentorshipSession.findMany({
    where: {
      outcome: "COMPLETED",
      mentorship: { mentorId: mentorUserId, isFreeOrConcessional: true },
    },
    select: { durationMinutes: true },
  });
  return sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
}

export type MentorImpact = {
  kpis: ImpactKpis;
  composite: number;
  sections: SectionSummary[];
  entries: NationBuildingEntryRow[];
};

export async function getMentorImpact(mentorUserId: string): Promise<MentorImpact> {
  const [entries, freeMinutes] = await Promise.all([
    prisma.nationBuildingEntry.findMany({
      where: { mentorId: mentorUserId },
      orderBy: { createdAt: "desc" },
    }) as Promise<NationBuildingEntryRow[]>,
    getFreeMentoringMinutes(mentorUserId),
  ]);

  const kpis = computeKpis(entries, freeMinutes);
  return {
    kpis,
    composite: computeCompositeScore(kpis),
    sections: buildSectionSummaries(entries),
    entries,
  };
}
