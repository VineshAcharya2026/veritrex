import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMentorImpact } from "@/lib/nation-building-impact";
import { syncPlatformNationBuildingEntries } from "@/lib/nation-building-sync";
import { recalculateNationBuildingBadges } from "@/lib/nation-building-badges";

export async function GET() {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  const mentorUserId = session.user.id;

  await syncPlatformNationBuildingEntries(mentorUserId);
  await recalculateNationBuildingBadges(mentorUserId);

  const [impact, badges] = await Promise.all([
    getMentorImpact(mentorUserId),
    prisma.mentorNationBuildingBadge.findMany({
      where: { mentorId: mentorUserId },
      orderBy: { earnedAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    kpis: impact.kpis,
    composite: impact.composite,
    sections: impact.sections,
    entries: impact.entries,
    badges: badges.map((b: { badge: string; earnedAt: Date }) => ({
      badge: b.badge,
      earnedAt: b.earnedAt,
    })),
  });
}
