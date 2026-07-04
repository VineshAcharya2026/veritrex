import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { sessionId } = await params;

  const mentorshipSession = await prisma.mentorshipSession.findUnique({
    where: { id: sessionId },
    include: {
      mentorship: { select: { mentorId: true, menteeId: true } },
      ratings: true,
    },
  });

  if (!mentorshipSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { mentorship, ratings } = mentorshipSession;
  const isMentor = session.user.id === mentorship.mentorId;
  const isMentee = session.user.id === mentorship.menteeId;

  if (!isMentor && !isMentee) {
    return NextResponse.json({ error: "Not your session" }, { status: 403 });
  }

  const bothSubmitted = ratings.length >= 2;
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sessionOldEnough =
    mentorshipSession.completedAt &&
    mentorshipSession.completedAt <= twentyFourHoursAgo;

  const canReveal = bothSubmitted || sessionOldEnough;

  const myRating = ratings.find((r) => r.raterId === session.user.id);
  const otherRating = ratings.find((r) => r.raterId !== session.user.id);

  return NextResponse.json({
    myRatingSubmitted: !!myRating,
    otherRatingSubmitted: !!otherRating,
    canReveal,
    myRating: myRating
      ? {
          weightedScore: myRating.weightedScore,
          raterRole: myRating.raterRole,
        }
      : null,
    receivedRating: canReveal && otherRating
      ? {
          weightedScore: otherRating.weightedScore,
          raterRole: otherRating.raterRole,
        }
      : null,
  });
}
