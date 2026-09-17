import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { AuthError } from "@/lib/auth/types";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const STATUS_ERRORS: Record<string, string> = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_FROZEN: "ACCOUNT_FROZEN",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.status === "PENDING") {
      return NextResponse.json({ error: STATUS_ERRORS.PENDING_APPROVAL }, { status: 403 });
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: STATUS_ERRORS.ACCOUNT_SUSPENDED }, { status: 403 });
    }
    if (user.status === "FROZEN") {
      return NextResponse.json({ error: STATUS_ERRORS.ACCOUNT_FROZEN }, { status: 403 });
    }
    if (user.status === "DELETED") {
      return NextResponse.json({ error: STATUS_ERRORS.ACCOUNT_DELETED }, { status: 403 });
    }

    const name = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.email;

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      name,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        name,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.code }, { status: 403 });
    }
    console.error("[auth/login]", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
