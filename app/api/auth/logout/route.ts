import { NextResponse } from "next/server";
import {
  clearSessionCookieOnResponse,
  getSessionTokenFromRequest,
  revokeSessionToken,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const token = await getSessionTokenFromRequest(request);
  if (token) {
    await revokeSessionToken(token);
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookieOnResponse(response, request);
  return response;
}
