import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionRateShell } from "@/components/rating/SessionRateShell";
import { FeedPageShell } from "@/components/feed/FeedPageShell";
import type { FeedProfileCardData } from "@/components/feed/FeedProfileCard";
import { isMenteeOnboardingComplete } from "@/lib/mentee-onboarding";

export default async function FeedPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "MENTOR" && session.user.role !== "MENTEE") {
    redirect("/dashboard/admin");
  }

  const userId = session.user.id;
  const [profile, mentorProfile, menteeProfile, trust, postCount, account] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.mentorProfile.findUnique({ where: { userId } }),
      prisma.menteeProfile.findUnique({ where: { userId } }),
      prisma.trustScoreRecord.findUnique({ where: { userId } }),
      prisma.feedPost.count({ where: { authorId: userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { phone: true } }),
    ]);

  if (
    session.user.role === "MENTEE" &&
    !isMenteeOnboardingComplete({
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      phone: account?.phone,
      ...(menteeProfile ?? {}),
    })
  ) {
    redirect("/dashboard/mentee/onboarding");
  }

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

  const card: FeedProfileCardData = {
    userId,
    role: session.user.role,
    name,
    avatar: profile?.avatar ?? null,
    coverImage: profile?.coverImage ?? null,
    headline,
    location,
    tier: trust?.tier ?? "EMERGING",
    postCount,
  };

  return (
    <SessionRateShell role={session.user.role}>
      <FeedPageShell
        profile={card}
        currentUserId={userId}
        authorName={name}
        authorAvatar={profile?.avatar ?? null}
        role={session.user.role}
      />
    </SessionRateShell>
  );
}
