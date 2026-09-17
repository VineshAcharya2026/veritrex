import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildSectionSummaries,
  computeCompositeScore,
  computeKpis,
  getMentorImpact,
  type NationBuildingEntryRow,
} from "@/lib/nation-building-impact";

export async function GET(request: Request) {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();

  const [impact, profile, badges] = await Promise.all([
    getMentorImpact(session.user.id),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
    prisma.mentorNationBuildingBadge.findMany({
      where: { mentorId: session.user.id },
      orderBy: { earnedAt: "asc" },
    }),
  ]);

  const entryYear = (e: NationBuildingEntryRow) =>
    new Date(e.eventDate ?? e.createdAt).getFullYear();
  const yearEntries = impact.entries.filter((e) => entryYear(e) === year);

  const kpis = computeKpis(yearEntries, 0);

  return NextResponse.json({
    year,
    mentorName: profile ? `${profile.firstName} ${profile.lastName}` : "Mentor",
    kpis,
    composite: computeCompositeScore(kpis),
    sections: buildSectionSummaries(yearEntries),
    stories: yearEntries
      .filter((e) => e.category === "IMPACT_STORY" && e.verified)
      .map((e) => ({
        id: e.id,
        title: e.title,
        testimonial: e.testimonial,
        description: e.description,
        evidenceUrls: e.evidenceUrls,
      })),
    badges: badges
      .filter((b: { earnedAt: Date }) => new Date(b.earnedAt).getFullYear() === year)
      .map((b: { badge: string }) => b.badge),
    availableYears: [...new Set(impact.entries.map(entryYear))].sort((a, b) => b - a),
  });
}
