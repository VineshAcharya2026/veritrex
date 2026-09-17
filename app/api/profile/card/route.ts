import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Compact profile card payload for LinkedIn-style dashboard rails. */
export async function GET() {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const userId = session.user.id;
  const [profile, mentorProfile, menteeProfile, trust, postCount] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.mentorProfile.findUnique({ where: { userId } }),
      prisma.menteeProfile.findUnique({ where: { userId } }),
      prisma.trustScoreRecord.findUnique({ where: { userId } }),
      prisma.feedPost.count({ where: { authorId: userId } }),
    ]);

  const name = profile
    ? `${profile.firstName} ${profile.lastName}`
    : session.user.name || "Member";
  const headline =
    mentorProfile?.professionalHeadline ||
    mentorProfile?.title ||
    menteeProfile?.currentDesignation ||
    menteeProfile?.currentRole ||
    null;
  const location =
    mentorProfile?.city ||
    (menteeProfile?.city
      ? `${menteeProfile.city}${menteeProfile.country ? `, ${menteeProfile.country}` : ""}`
      : null);

  return NextResponse.json({
    userId,
    role: session.user.role,
    name,
    avatar: profile?.avatar ?? null,
    coverImage: profile?.coverImage ?? null,
    headline,
    location,
    tier: trust?.tier ?? "EMERGING",
    postCount,
  });
}
