import type { NationBuildingCategory } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { recalculateNationBuildingBadges } from "@/lib/nation-building-badges";

const FREE_SESSIONS_REF = "free-sessions";

function outcomeCategory(outcomeType: string): NationBuildingCategory {
  switch (outcomeType) {
    case "PLACED":
      return "JOBS_REFERRALS";
    case "STARTED_VENTURE":
      return "STARTUP_SUCCESS";
    default:
      // PROMOTED, CHANGED_INDUSTRY, CHANGED_JOB
      return "CAREER_GROWTH";
  }
}

function outcomeTitle(outcomeType: string): string {
  switch (outcomeType) {
    case "PLACED":
      return "Mentee placed in a role";
    case "PROMOTED":
      return "Mentee promoted";
    case "STARTED_VENTURE":
      return "Mentee started a venture";
    case "CHANGED_INDUSTRY":
      return "Mentee changed industry";
    case "CHANGED_JOB":
      return "Mentee changed job";
    default:
      return "Verified mentee outcome";
  }
}

/**
 * Mirror already-verified platform records into NationBuildingEntry rows so the
 * impact engine has a single source of truth. Platform rows are auto-verified
 * and idempotent via the (mentorId, source, externalRef) unique key.
 */
export async function syncPlatformNationBuildingEntries(mentorUserId: string) {
  const [freeSessions, outcomes] = await Promise.all([
    prisma.mentorshipSession.findMany({
      where: {
        outcome: "COMPLETED",
        mentorship: { mentorId: mentorUserId, isFreeOrConcessional: true },
      },
      select: { durationMinutes: true },
    }),
    prisma.mentorshipOutcome.findMany({
      where: { mentorId: mentorUserId, verified: true },
    }),
  ]);

  const freeSessionCount = freeSessions.length;
  const freeMinutes = freeSessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);

  if (freeSessionCount > 0) {
    await prisma.nationBuildingEntry.upsert({
      where: {
        mentorId_source_externalRef: {
          mentorId: mentorUserId,
          source: "PLATFORM",
          externalRef: FREE_SESSIONS_REF,
        },
      },
      create: {
        mentorId: mentorUserId,
        category: "FREE_MENTORING",
        title: "Free mentoring sessions",
        description: "Automatically tracked from completed free or concessional sessions.",
        quantity: freeSessionCount,
        source: "PLATFORM",
        externalRef: FREE_SESSIONS_REF,
        verified: true,
        verifiedAt: new Date(),
      },
      update: {
        quantity: freeSessionCount,
        verified: true,
      },
    });
  }

  for (const outcome of outcomes) {
    await prisma.nationBuildingEntry.upsert({
      where: {
        mentorId_source_externalRef: {
          mentorId: mentorUserId,
          source: "PLATFORM",
          externalRef: outcome.id,
        },
      },
      create: {
        mentorId: mentorUserId,
        category: outcomeCategory(outcome.outcomeType),
        title: outcomeTitle(outcome.outcomeType),
        description: outcome.notes ?? null,
        quantity: 1,
        location: outcome.city ?? null,
        mentorshipId: outcome.mentorshipId,
        source: "PLATFORM",
        externalRef: outcome.id,
        verified: true,
        verifiedAt: new Date(),
      },
      update: {
        category: outcomeCategory(outcome.outcomeType),
        verified: true,
      },
    });
  }

  return { freeSessionCount, freeMinutes, syncedOutcomes: outcomes.length };
}

/**
 * One-off/periodic backfill: sync platform-derived entries and recalculate
 * badges for every mentor. Safe to run repeatedly (idempotent).
 */
export async function backfillNationBuildingEntries() {
  const mentors: { id: string }[] = await prisma.user.findMany({
    where: { role: "MENTOR" },
    select: { id: true },
  });

  for (const mentor of mentors) {
    await syncPlatformNationBuildingEntries(mentor.id);
    await recalculateNationBuildingBadges(mentor.id);
  }

  return { mentorsProcessed: mentors.length };
}
