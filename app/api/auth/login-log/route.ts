import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/utils";

export async function POST(request: Request) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const userAgent = request.headers.get("user-agent") ?? undefined;

  await prisma.loginEvent.create({
    data: {
      userId: session.user.id,
      email: session.user.email ?? "",
      role: session.user.role,
      ipAddress: getClientIp(request),
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
