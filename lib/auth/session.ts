import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";
import type { AppSession, SessionClaims, SessionUser } from "@/lib/auth/types";
import { resolveAuthSecret } from "@/lib/auth/resolve-secret";
import { getAuthKv } from "@/lib/db/client";
import { resolveAppUrl } from "@/lib/platform";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

function base64UrlEncode(data: Uint8Array | ArrayBuffer | string): string {
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : data;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signJwt(payload: Record<string, unknown>): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(resolveAuthSecret());
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${base64UrlEncode(signature)}`;
}

async function verifyJwt(token: string): Promise<SessionClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(resolveAuthSecret());
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(encodedSignature) as BufferSource,
    new TextEncoder().encode(data)
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload))) as SessionClaims;
    if (!payload?.id || !payload?.email || !payload?.role || !payload?.status) return null;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;

    const kv = getAuthKv();
    if (kv && payload.jti) {
      const revoked = await kv.get(`revoked:${payload.jti}`);
      if (revoked) return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = {
    ...user,
    jti: crypto.randomUUID(),
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };
  return signJwt(claims as unknown as Record<string, unknown>);
}

function isSecureCookie(request?: Request): boolean {
  if (resolveAppUrl().startsWith("https://")) return true;
  if (request?.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https") {
    return true;
  }
  return process.env.NODE_ENV === "production";
}

export function getSessionCookieOptions(
  maxAge = SESSION_MAX_AGE_SECONDS,
  request?: Request
) {
  return {
    httpOnly: true,
    secure: isSecureCookie(request),
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** @deprecated Prefer applySessionCookie on NextResponse in route handlers. */
export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return getSessionCookieOptions(maxAge);
}

export function applySessionCookie(
  response: NextResponse,
  token: string,
  request?: Request
): void {
  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions(SESSION_MAX_AGE_SECONDS, request));
}

export function clearSessionCookieOnResponse(response: NextResponse): void {
  response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, getSessionCookieOptions());
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function revokeSessionToken(token: string): Promise<void> {
  const claims = await verifyJwt(token);
  if (!claims?.jti) return;
  const kv = getAuthKv();
  if (!kv) return;
  const ttl = Math.max(claims.exp - Math.floor(Date.now() / 1000), 60);
  await kv.put(`revoked:${claims.jti}`, "1", { expirationTtl: ttl });
}

export async function getSessionTokenFromRequest(request?: Request): Promise<string | null> {
  if (request) {
    const header = request.headers.get("cookie") ?? "";
    const match = header.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }

  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionFromRequest(request?: Request): Promise<AppSession | null> {
  const token = await getSessionTokenFromRequest(request);
  if (!token) return null;
  const claims = await verifyJwt(token);
  if (!claims) return null;
  return {
    user: {
      id: claims.id,
      email: claims.email,
      role: claims.role,
      status: claims.status,
      name: claims.name,
    },
  };
}

export async function getSession(): Promise<AppSession | null> {
  return getSessionFromRequest();
}

export { verifyJwt, SESSION_COOKIE };
