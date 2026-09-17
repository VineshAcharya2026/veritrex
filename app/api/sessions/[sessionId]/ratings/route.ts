import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRatingPeriodClosed, isRatingWindowOpen } from "@/lib/rating-engine";

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
      mentorship: true,
      ratings: { select: { raterId: true } },
    },
  });

  if (!mentorshipSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { mentorship, ratings } = mentorshipSession;
  if (!mentorship) {
    return NextResponse.json({ error: "Mentorship not found for session" }, { status: 404 });
  }
  const isMentor = session.user.id === mentorship.mentorId;
  const isMentee = session.user.id === mentorship.menteeId;

  if (!isMentor && !isMentee) {
    return NextResponse.json({ error: "Not your session" }, { status: 403 });
  }

  const ratingPeriodClosed = isRatingPeriodClosed({
    completedAt: mentorshipSession.completedAt,
    ratings,
  });
  const myRating = ratings.find((r) => r.raterId === session.user.id);
  const otherRating = ratings.find((r) => r.raterId !== session.user.id);
  const ratingWindowOpen = isRatingWindowOpen(mentorshipSession.completedAt);

  // Raw session scores are never exposed — only submission status.
  return NextResponse.json({
    myRatingSubmitted: !!myRating,
    otherRatingSubmitted: !!otherRating,
    ratingPeriodClosed,
    ratingWindowClosed: !ratingWindowOpen,
  });
}
