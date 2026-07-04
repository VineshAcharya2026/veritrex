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
      mentorProfile: {
        include: {
          skills: { orderBy: { masteryLevel: "desc" }, take: 10 },
          _count: { select: { content: true } },
        },
      },
      trustScore: { select: { tier: true, totalScore: true } },
    },
  });

  if (!user || user.role !== "MENTOR" || !user.mentorProfile) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const p = user.mentorProfile;
  const profile = user.profile;
  const trust = user.trustScore;

  return NextResponse.json({
    id: user.id,
    name: profile ? `${profile.firstName} ${profile.lastName}` : "Mentor",
    avatar: profile?.avatar ?? null,
    professionalHeadline: p.professionalHeadline ?? p.title ?? null,
    professionalSummary: p.professionalSummary ?? null,
    company: p.company,
    title: p.title,
    threeWords: p.threeWords,
    areasOfExpertise: p.areasOfExpertise,
    yearsOfExperienceRange: p.yearsOfExperienceRange,
    whyMentor: p.whyMentor,
    challengesCanHelp: p.challengesCanHelp,
    mentoringStyle: p.mentoringStyle,
    achievements: p.achievements,
    certifications: p.certifications,
    personalInterests: p.personalInterests,
    influentialQuote: p.influentialQuote,
    preferredFormats: p.preferredFormats,
    languages: p.languages,
    welcomeMessage: p.welcomeMessage,
    completeSentence: p.completeSentence,
    linkedInUrl: p.linkedInUrl,
    city: p.city,
    industry: p.industry,
    skills: p.skills.map((s) => ({ skill: s.skill, masteryLevel: s.masteryLevel })),
    contentCount: p._count.content,
    trustTier: trust?.tier ?? "EMERGING",
    trustScore: trust?.totalScore ?? 0,
    isEliteFounder100: p.isEliteFounder100,
    offersFreeMentorship: p.offersFreeMentorship,
  });
}
