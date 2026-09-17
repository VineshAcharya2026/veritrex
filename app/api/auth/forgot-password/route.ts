import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createPasswordResetToken,
  sendPasswordResetLink,
} from "@/lib/password-reset";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, status: true },
  });

  // Always return success to avoid email enumeration
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ ok: true });
  }

  const token = await createPasswordResetToken(user.id, user.email);
  if (token) {
    const origin = new URL(request.url).origin;
    await sendPasswordResetLink(user.email, token, origin);
  }

  return NextResponse.json({ ok: true });
}
