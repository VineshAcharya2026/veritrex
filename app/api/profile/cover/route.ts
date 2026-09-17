import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  coverImage: z.string().nullable(),
});

export async function GET() {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { coverImage: true, avatar: true },
  });

  return NextResponse.json({
    coverImage: profile?.coverImage ?? null,
    avatar: profile?.avatar ?? null,
  });
}

export async function PATCH(request: Request) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.profile.update({
    where: { userId: session.user.id },
    data: { coverImage: parsed.data.coverImage },
    select: { coverImage: true },
  });

  return NextResponse.json(updated);
}
