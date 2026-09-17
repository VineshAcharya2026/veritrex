import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zodErrorMessage } from "@/lib/api-errors";

const postSchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const { threadId } = await params;
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (
    thread.participantAId !== session.user.id &&
    thread.participantBId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  await prisma.message.updateMany({
    where: {
      threadId,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const { threadId } = await params;
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (
    thread.participantAId !== session.user.id &&
    thread.participantBId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = postSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error.flatten()) }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      threadId,
      senderId: session.user.id,
      body: parsed.data.body.trim(),
    },
  });

  await prisma.messageThread.update({
    where: { id: threadId },
    data: { lastMessageAt: message.createdAt },
  });

  return NextResponse.json(
    {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      senderId: message.senderId,
    },
    { status: 201 }
  );
}
