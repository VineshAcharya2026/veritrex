import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addStrike } from "@/lib/rating-engine";
import { awardCredits } from "@/lib/credits";
import { assertFreeMentorshipMinutes } from "@/lib/free-mentorship";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

const schema = z.object({
  outcome: z.enum([
    "COMPLETED",
    "MENTOR_NO_SHOW",
    "MENTEE_NO_SHOW",
    "MUTUAL_CANCEL",
    "LATE_CANCEL",
  ]),
  durationMinutes: z.number().int().min(15).max(240).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { sessionId } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const mentorshipSession = await prisma.mentorshipSession.findUnique({
    where: { id: sessionId },
    include: {
      mentorship: {
        select: {
          mentorId: true,
          menteeId: true,
          id: true,
          isFreeOrConcessional: true,
        },
      },
    },
  });
  if (!mentorshipSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { mentorship } = mentorshipSession;
  const isMentor = session.user.id === mentorship.mentorId;
  const isMentee = session.user.id === mentorship.menteeId;
  if (!isMentor && !isMentee) {
    return NextResponse.json({ error: "Not your session" }, { status: 403 });
  }

  if (mentorshipSession.outcome) {
    return NextResponse.json({ error: "Outcome already logged" }, { status: 400 });
  }

  let { outcome, durationMinutes } = parsed.data;
  const scheduledAt = new Date(mentorshipSession.scheduledAt);
  const msUntilSession = scheduledAt.getTime() - Date.now();
  const EARLY_START_MS = 15 * 60 * 1000;

  // Don't allow completed / no-show logging before the session is due (15m early OK).
  if (
    (outcome === "COMPLETED" ||
      outcome === "MENTOR_NO_SHOW" ||
      outcome === "MENTEE_NO_SHOW") &&
    msUntilSession > EARLY_START_MS
  ) {
    return NextResponse.json(
      { error: "This session has not started yet. You can log the outcome after the scheduled time." },
      { status: 400 }
    );
  }

  // Mutual cancel requires 4+ hours notice before start; after start, mutual stays mutual (no strike).
  if (
    outcome === "MUTUAL_CANCEL" &&
    msUntilSession >= 0 &&
    msUntilSession < FOUR_HOURS_MS
  ) {
    outcome = "LATE_CANCEL";
  }
  if (outcome === "LATE_CANCEL" && msUntilSession >= FOUR_HOURS_MS) {
    outcome = "MUTUAL_CANCEL";
  }

  if (outcome === "COMPLETED" && !durationMinutes) {
    return NextResponse.json(
      { error: "Duration in minutes is required for completed sessions" },
      { status: 400 }
    );
  }

  if (outcome === "COMPLETED" && mentorship.isFreeOrConcessional) {
    try {
      await assertFreeMentorshipMinutes(mentorship.mentorId, durationMinutes!);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Free mentorship cap exceeded" },
        { status: 400 }
      );
    }
  }

  await prisma.mentorshipSession.update({
    where: { id: sessionId },
    data: {
      outcome,
      outcomeLoggedBy: session.user.id,
      completedAt: outcome === "COMPLETED" ? new Date() : undefined,
      durationMinutes: outcome === "COMPLETED" ? durationMinutes : undefined,
    },
  });

  if (outcome === "COMPLETED" && mentorship.isFreeOrConcessional && durationMinutes) {
    await prisma.mentorProfile.update({
      where: { userId: mentorship.mentorId },
      data: { freeMentorshipMinutesUsed: { increment: durationMinutes } },
    });
  }

  // Mentor no-show → strike mentor; mentee gets free remaining sessions to rebook
  if (outcome === "MENTOR_NO_SHOW") {
    await addStrike(mentorship.mentorId, sessionId, "NO_SHOW");
    await prisma.mentorship.update({
      where: { id: mentorship.id },
      data: { isFreeOrConcessional: true },
    });
    await prisma.notification.create({
      data: {
        userId: mentorship.menteeId,
        message:
          "Your mentor did not show up. Your remaining sessions with them are now free — rebook anytime.",
        type: "SESSION_NO_SHOW",
      },
    });
  }

  // Mentee no-show → strike mentee; mentor gets partial credit for blocked time
  if (outcome === "MENTEE_NO_SHOW") {
    await addStrike(mentorship.menteeId, sessionId, "NO_SHOW");
    try {
      await awardCredits(
        mentorship.mentorId,
        5,
        "MENTORSHIP_COMPLETED",
        "Partial credit: mentee no-show",
        mentorship.id
      );
    } catch {
      // Mentor may not have a profile yet
    }
  }

  // Late cancel (<4h) → reliability strike on the person who logged it
  if (outcome === "LATE_CANCEL") {
    await addStrike(session.user.id, sessionId, "LATE_CANCEL");
  }

  return NextResponse.json({ outcome });
}
