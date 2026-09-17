import { prisma } from "@/lib/prisma";
import { getFreeMentorshipMinutesCap } from "@/lib/config";

export async function getMentorFreeMinutesUsed(mentorUserId: string) {
  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: mentorUserId },
    select: { freeMentorshipMinutesUsed: true },
  });
  return profile?.freeMentorshipMinutesUsed ?? 0;
}

export async function getMentorFreeHoursStatus(mentorUserId: string) {
  const [used, capMinutes] = await Promise.all([
    getMentorFreeMinutesUsed(mentorUserId),
    getFreeMentorshipMinutesCap(),
  ]);
  return {
    usedMinutes: used,
    usedHours: Math.round((used / 60) * 10) / 10,
    capMinutes,
    capHours: capMinutes / 60,
    remainingMinutes: Math.max(0, capMinutes - used),
  };
}

export async function assertFreeMentorshipMinutes(
  mentorUserId: string,
  additionalMinutes: number
) {
  const status = await getMentorFreeHoursStatus(mentorUserId);
  if (additionalMinutes > status.remainingMinutes) {
    throw new Error(
      `Free mentorship cap exceeded. You have ${(status.remainingMinutes / 60).toFixed(1)} hours remaining of ${status.capHours} hours per cycle.`
    );
  }
  return status;
}
