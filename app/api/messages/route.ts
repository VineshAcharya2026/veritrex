import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zodErrorMessage } from "@/lib/api-errors";

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function findThread(userA: string, userB: string) {
  const [participantAId, participantBId] = orderedPair(userA, userB);
  return prisma.messageThread.findFirst({
    where: { participantAId, participantBId },
  });
}

function displayName(user: {
  profile: { firstName: string; lastName: string } | null;
  email: string;
}) {
  return user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user.email;
}

export async function GET() {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const threads = await prisma.messageThread.findMany({
    where: {
      OR: [{ participantAId: session.user.id }, { participantBId: session.user.id }],
    },
    include: {
      participantA: { include: { profile: true } },
      participantB: { include: { profile: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    threads: threads.map((t) => {
      const other =
        t.participantAId === session.user.id ? t.participantB : t.participantA;
      const last = t.messages[0];
      return {
        id: t.id,
        otherUser: {
          id: other.id,
          name: displayName(other),
          avatar: other.profile?.avatar ?? null,
          role: other.role,
        },
        lastMessage: last
          ? { body: last.body, createdAt: last.createdAt, senderId: last.senderId }
          : null,
        lastMessageAt: t.lastMessageAt,
      };
    }),
  });
}

const createSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error.flatten()) }, { status: 400 });
  }

  const { recipientId, body } = parsed.data;
  if (recipientId === session.user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const recipient = await prisma.user.findFirst({
    where: { id: recipientId, status: "ACTIVE", role: { in: ["MENTOR", "MENTEE"] } },
  });
  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  let thread = await findThread(session.user.id, recipientId);
  if (!thread) {
    const [participantAId, participantBId] = orderedPair(session.user.id, recipientId);
    thread = await prisma.messageThread.create({
      data: { participantAId, participantBId },
    });
  }

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      senderId: session.user.id,
      body: body.trim(),
    },
  });

  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: message.createdAt },
  });

  return NextResponse.json(
    {
      threadId: thread.id,
      message: {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        senderId: message.senderId,
      },
    },
    { status: 201 }
  );
}
