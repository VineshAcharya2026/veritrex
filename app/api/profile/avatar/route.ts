import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { zodErrorMessage } from "@/lib/api-errors";

const schema = z.object({
  avatar: z.string().nullable(),
});

export async function GET() {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { avatar: true },
  });

  return NextResponse.json({ avatar: profile?.avatar ?? null });
}

export async function PATCH(request: Request) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error.flatten()) }, { status: 400 });
  }

  const updated = await prisma.profile.update({
    where: { userId: session.user.id },
    data: { avatar: parsed.data.avatar },
    select: { avatar: true },
  });

  return NextResponse.json(updated);
}
