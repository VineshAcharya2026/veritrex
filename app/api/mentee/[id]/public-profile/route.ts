import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      menteeProfile: true,
      trustScore: { select: { tier: true } },
    },
  });

  if (!user || user.role !== "MENTEE" || !user.menteeProfile) {
    return NextResponse.json({ error: "Mentee not found" }, { status: 404 });
  }

  const p = user.menteeProfile;
  const profile = user.profile;
  const trust = user.trustScore;

  return NextResponse.json({
    id: user.id,
    name: profile ? `${profile.firstName} ${profile.lastName}` : "Mentee",
    avatar: profile?.avatar ?? null,
    currentRole: p.currentRole,
    currentStatus: p.currentStatus,
    currentInstitution: p.currentInstitution,
    currentDesignation: p.currentDesignation,
    country: p.country,
    city: p.city,
    preferredIndustry: p.preferredIndustry,
    yearsOfExperience: p.yearsOfExperience,
    careerGoal: p.careerGoal,
    guidanceAreas: p.guidanceAreas,
    skillsToDevelo: p.skillsToDevelo,
    biggestChallenge: p.biggestChallenge,
    languages: p.languages,
    trustTier: trust?.tier ?? "EMERGING",
  });
}
