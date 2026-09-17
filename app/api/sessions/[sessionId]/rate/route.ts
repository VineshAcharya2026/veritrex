import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeMenteeRatesMentorScore,
  computeMentorRatesMenteeScore,
  finalizeSessionRatings,
  isRatingWindowOpen,
} from "@/lib/rating-engine";
import {
  menteeRatesMentorSchema,
  mentorRatesMenteeSchema,
} from "@/lib/rating-questionnaire";

function apiError(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  return fallback;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { sessionId } = await params;

  const mentorshipSession = await prisma.mentorshipSession.findUnique({
    where: { id: sessionId },
    include: {
      mentorship: { select: { mentorId: true, menteeId: true } },
      ratings: { select: { raterId: true, id: true } },
    },
  });

  if (!mentorshipSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (mentorshipSession.outcome !== "COMPLETED") {
    return NextResponse.json(
      { error: "Can only rate completed sessions" },
      { status: 400 }
    );
  }

  if (!isRatingWindowOpen(mentorshipSession.completedAt)) {
    return NextResponse.json(
      { error: "The rating window for this session has closed (7 days)." },
      { status: 400 }
    );
  }

  const { mentorship } = mentorshipSession;
  const isMentor = session.user.id === mentorship.mentorId;
  const isMentee = session.user.id === mentorship.menteeId;

  if (!isMentor && !isMentee) {
    return NextResponse.json({ error: "Not your session" }, { status: 403 });
  }

  const alreadyRated = mentorshipSession.ratings.some(
    (r) => r.raterId === session.user.id
  );
  if (alreadyRated) {
    return NextResponse.json({ error: "Already rated this session" }, { status: 400 });
  }

  const body = await request.json();

  if (isMentee) {
    const parsed = menteeRatesMentorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: apiError(parsed.error.message, "Invalid rating answers") },
        { status: 400 }
      );
    }

    const weightedScore = computeMenteeRatesMentorScore(parsed.data);
    const rating = await prisma.sessionRating.create({
      data: {
        sessionId,
        raterId: session.user.id,
        ratedUserId: mentorship.mentorId,
        raterRole: "MENTEE",
        impact: parsed.data.impact,
        productivity: parsed.data.productivity,
        goalAchievement: parsed.data.goalAchievement,
        realisticLearningPath: parsed.data.realisticLearningPath,
        approach: parsed.data.approach,
        mannersRespect: parsed.data.mannersRespect,
        weightedScore,
      },
    });

    await finalizeSessionRatings(sessionId, mentorshipSession.completedAt, [
      mentorship.mentorId,
      mentorship.menteeId,
    ]);

    return NextResponse.json({ id: rating.id, submitted: true }, { status: 201 });
  }

  const parsed = mentorRatesMenteeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: apiError(parsed.error.message, "Invalid rating answers") },
      { status: 400 }
    );
  }

  const weightedScore = computeMentorRatesMenteeScore(parsed.data);
  const rating = await prisma.sessionRating.create({
    data: {
      sessionId,
      raterId: session.user.id,
      ratedUserId: mentorship.menteeId,
      raterRole: "MENTOR",
      preparedness: parsed.data.preparedness,
      taskCompletion: parsed.data.taskCompletion,
      sessionGoals: parsed.data.sessionGoals,
      implementation: parsed.data.implementation,
      growth: parsed.data.growth,
      respectBehavior: parsed.data.respectBehavior,
      weightedScore,
    },
  });

  await finalizeSessionRatings(sessionId, mentorshipSession.completedAt, [
    mentorship.mentorId,
    mentorship.menteeId,
  ]);

  return NextResponse.json({ id: rating.id, submitted: true }, { status: 201 });
}
