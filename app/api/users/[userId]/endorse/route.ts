import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUserVerified, hasEndorsed } from "@/lib/endorsements";
import { evaluateTierChange } from "@/lib/rating-engine";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { userId: endorsedId } = await params;

  if (endorsedId === session.user.id) {
    return NextResponse.json({ error: "Cannot endorse yourself" }, { status: 400 });
  }

  const endorsed = await prisma.user.findUnique({
    where: { id: endorsedId },
    select: { id: true, status: true },
  });
  if (!endorsed || endorsed.status !== "ACTIVE") {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const endorserVerified = await isUserVerified(session.user.id);
  if (!endorserVerified) {
    return NextResponse.json(
      { error: "Complete your profile with a photo before endorsing others" },
      { status: 403 }
    );
  }

  if (await hasEndorsed(session.user.id, endorsedId)) {
    return NextResponse.json({ error: "Already endorsed" }, { status: 400 });
  }

  await prisma.userEndorsement.create({
    data: {
      endorserId: session.user.id,
      endorsedId,
    },
  });

  await evaluateTierChange(endorsedId);

  return NextResponse.json({ endorsed: true }, { status: 201 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { userId: endorsedId } = await params;

  const existing = await prisma.userEndorsement.findFirst({
    where: { endorserId: session.user.id, endorsedId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Endorsement not found" }, { status: 404 });
  }

  await prisma.userEndorsement.delete({ where: { id: existing.id } });
  await evaluateTierChange(endorsedId);

  return NextResponse.json({ removed: true });
}
