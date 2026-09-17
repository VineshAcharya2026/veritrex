import { prisma } from "@/lib/prisma";

/** Verified = profile exists with avatar (same rule as TrustScore verification). */
export async function isUserVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profile: { select: { avatar: true } } },
  });
  return !!user?.profile?.avatar;
}

export async function countVerifiedEndorsements(endorsedUserId: string): Promise<number> {
  const endorsements = await prisma.userEndorsement.findMany({
    where: { endorsedId: endorsedUserId },
    include: {
      endorser: { include: { profile: { select: { avatar: true } } } },
    },
  });

  return endorsements.filter((e) => !!e.endorser.profile?.avatar).length;
}

export async function hasEndorsed(
  endorserId: string,
  endorsedId: string
): Promise<boolean> {
  const existing = await prisma.userEndorsement.findFirst({
    where: { endorserId, endorsedId },
  });
  return !!existing;
}
