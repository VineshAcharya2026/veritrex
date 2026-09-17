import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  getSessionTokenFromRequest,
  revokeSessionToken,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const token = await getSessionTokenFromRequest(request);
  if (token) {
    await revokeSessionToken(token);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
