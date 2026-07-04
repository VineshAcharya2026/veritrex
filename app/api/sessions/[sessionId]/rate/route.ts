import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computeMenteeRatesMentorScore,
  computeMentorRatesMenteeScore,
} from "@/lib/rating-engine";

const dim = z.number().int().min(1).max(5);

const menteeRatesMentorSchema = z.object({
  knowledge: dim,
  actionability: dim,
  preparation: dim,
  clarity: dim,
  responsiveness: dim,
});

const mentorRatesMenteeSchema = z.object({
  goalClarity: dim,
  menteePreparation: dim,
  engagement: dim,
  followThrough: dim,
});

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
      ratings: { select: { raterId: true } },
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
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const weightedScore = computeMenteeRatesMentorScore(parsed.data);

    const rating = await prisma.sessionRating.create({
      data: {
        sessionId,
        raterId: session.user.id,
        ratedUserId: mentorship.mentorId,
        raterRole: "MENTEE",
        knowledge: parsed.data.knowledge,
        actionability: parsed.data.actionability,
        preparation: parsed.data.preparation,
        clarity: parsed.data.clarity,
        responsiveness: parsed.data.responsiveness,
        weightedScore,
      },
    });

    return NextResponse.json({ id: rating.id, weightedScore }, { status: 201 });
  }

  // Mentor rates mentee
  const parsed = mentorRatesMenteeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const weightedScore = computeMentorRatesMenteeScore(parsed.data);

  const rating = await prisma.sessionRating.create({
    data: {
      sessionId,
      raterId: session.user.id,
      ratedUserId: mentorship.menteeId,
      raterRole: "MENTOR",
      goalClarity: parsed.data.goalClarity,
      menteePreparation: parsed.data.menteePreparation,
      engagement: parsed.data.engagement,
      followThrough: parsed.data.followThrough,
      weightedScore,
    },
  });

  return NextResponse.json({ id: rating.id, weightedScore }, { status: 201 });
}
