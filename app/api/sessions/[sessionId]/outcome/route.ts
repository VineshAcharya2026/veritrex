import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addStrike } from "@/lib/rating-engine";
import { awardCredits } from "@/lib/credits";

const schema = z.object({
  outcome: z.enum(["COMPLETED", "MENTOR_NO_SHOW", "MENTEE_NO_SHOW", "MUTUAL_CANCEL"]),
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
      mentorship: { select: { mentorId: true, menteeId: true, id: true } },
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

  const { outcome } = parsed.data;

  await prisma.mentorshipSession.update({
    where: { id: sessionId },
    data: {
      outcome,
      outcomeLoggedBy: session.user.id,
      completedAt: outcome === "COMPLETED" ? new Date() : undefined,
    },
  });

  if (outcome === "MENTOR_NO_SHOW") {
    await addStrike(mentorship.mentorId, sessionId, "NO_SHOW");
    await prisma.notification.create({
      data: {
        userId: mentorship.menteeId,
        message: "Your mentor did not show up. A free credit has been issued.",
        type: "SESSION_NO_SHOW",
      },
    });
  }

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

  return NextResponse.json({ outcome });
}
