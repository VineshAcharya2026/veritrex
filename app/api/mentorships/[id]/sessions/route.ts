import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  scheduledAt: z.string().datetime(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;

  const mentorship = await prisma.mentorship.findFirst({
    where: {
      id,
      OR: [
        { mentorId: session.user.id },
        { menteeId: session.user.id },
      ],
    },
  });
  if (!mentorship) {
    return NextResponse.json({ error: "Mentorship not found" }, { status: 404 });
  }

  const sessions = await prisma.mentorshipSession.findMany({
    where: { mentorshipId: id },
    orderBy: { scheduledAt: "desc" },
    include: {
      ratings: {
        select: { raterId: true, raterRole: true, createdAt: true },
      },
      _count: { select: { strikes: true } },
    },
  });

  return NextResponse.json(sessions);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const mentorship = await prisma.mentorship.findFirst({
    where: {
      id,
      status: "ACTIVE",
      OR: [
        { mentorId: session.user.id },
        { menteeId: session.user.id },
      ],
    },
  });
  if (!mentorship) {
    return NextResponse.json({ error: "Active mentorship not found" }, { status: 404 });
  }

  const mentorshipSession = await prisma.mentorshipSession.create({
    data: {
      mentorshipId: id,
      scheduledAt: new Date(parsed.data.scheduledAt),
    },
  });

  return NextResponse.json(mentorshipSession, { status: 201 });
}
