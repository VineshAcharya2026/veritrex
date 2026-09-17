import { NextResponse } from "next/server";
import type { NationBuildingBadge } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { getMentorImpact } from "@/lib/nation-building-impact";

const BADGE_PRIORITY: NationBuildingBadge[] = [
  "NATION_BUILDER",
  "OPPORTUNITY_CREATOR",
  "CAREER_CATALYST",
  "STARTUP_ENABLER",
  "EDUCATION_CHAMPION",
  "COMMUNITY_MENTOR",
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 50);

  const groups = await prisma.nationBuildingEntry.groupBy({
    by: ["mentorId"],
    where: { verified: true },
    _count: { id: true },
  });
  const mentorIds = groups.map((g: { mentorId: string }) => g.mentorId);
  if (mentorIds.length === 0) {
    return NextResponse.json({ leaders: [] });
  }

  const [impacts, profiles, badges] = await Promise.all([
    Promise.all(
      mentorIds.map(async (id) => ({ id, impact: await getMentorImpact(id) }))
    ),
    prisma.user.findMany({
      where: { id: { in: mentorIds }, status: "ACTIVE", role: "MENTOR" },
      include: { profile: true, mentorProfile: true },
    }),
    prisma.mentorNationBuildingBadge.findMany({
      where: { mentorId: { in: mentorIds } },
    }),
  ]);

  const profileById = new Map<string, any>(profiles.map((p: any) => [p.id, p]));
  const badgesByMentor = new Map<string, NationBuildingBadge[]>();
  for (const b of badges as { mentorId: string; badge: NationBuildingBadge }[]) {
    const list = badgesByMentor.get(b.mentorId) ?? [];
    list.push(b.badge);
    badgesByMentor.set(b.mentorId, list);
  }

  const leaders = impacts
    .map(({ id, impact }) => {
      const user = profileById.get(id);
      if (!user) return null;
      const mentorBadges = badgesByMentor.get(id) ?? [];
      const topBadge =
        BADGE_PRIORITY.find((b) => mentorBadges.includes(b)) ?? null;
      return {
        mentorId: id,
        name: user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : "Mentor",
        avatar: user.profile?.avatar ?? null,
        headline: user.mentorProfile?.professionalHeadline ?? user.mentorProfile?.title ?? null,
        composite: impact.composite,
        kpis: impact.kpis,
        topBadge,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null && l.composite > 0)
    .sort((a, b) => b.composite - a.composite)
    .slice(0, limit)
    .map((l, i) => ({ ...l, rank: i + 1 }));

  return NextResponse.json({ leaders });
}
