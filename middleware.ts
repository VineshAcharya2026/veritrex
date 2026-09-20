import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import type { SessionClaims } from "@/lib/auth/types";
import type { Role } from "@/lib/db/types";
import { dashboardPathForRole } from "@/lib/auth/dashboard";
import { resolveAuthSecret } from "@/lib/auth/resolve-secret";

function base64UrlDecode(input: string): Uint8Array {
  const padded = input + "=".repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyToken(token: string, secret: string): Promise<SessionClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(encodedSignature) as BufferSource,
    new TextEncoder().encode(data)
  );
  if (!valid) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(encodedPayload))
    ) as SessionClaims;
    if (!payload?.id || !payload?.role || !payload?.status) return null;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Exact role prefix for dedicated dashboards. */
const roleRoutes: Record<string, Role> = {
  "/dashboard/admin": "SUPER_ADMIN",
  "/dashboard/mentor": "MENTOR",
  "/dashboard/mentee": "MENTEE",
};

/** Paths that only MENTOR | MENTEE may access (SUPER_ADMIN redirected home). */
const mentorMenteeOnly = ["/dashboard/feed", "/dashboard/session"];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const publicPaths = ["/login", "/register", "/pending-approval", "/"];
  const isPublic =
    publicPaths.some((p) => path === p || path.startsWith("/api/auth")) ||
    path.startsWith("/mentor/") ||
    path.startsWith("/mentee/");

  let secret: string | undefined;
  try {
    secret = resolveAuthSecret();
  } catch {
    secret = undefined;
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const claims = token && secret ? await verifyToken(token, secret) : null;

  // Already logged in → bounce away from auth pages
  if (claims && (path === "/login" || path === "/register")) {
    if (claims.status === "PENDING") {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }
    return NextResponse.redirect(new URL(dashboardPathForRole(claims.role), req.url));
  }

  if (!claims && !isPublic && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (claims && path.startsWith("/dashboard")) {
    if (claims.status === "PENDING" && path !== "/pending-approval") {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }

    for (const prefix of mentorMenteeOnly) {
      if (path === prefix || path.startsWith(`${prefix}/`)) {
        if (claims.role !== "MENTOR" && claims.role !== "MENTEE") {
          return NextResponse.redirect(new URL(dashboardPathForRole(claims.role), req.url));
        }
      }
    }

    for (const [prefix, requiredRole] of Object.entries(roleRoutes)) {
      if (path.startsWith(prefix) && claims.role !== requiredRole) {
        return NextResponse.redirect(new URL(dashboardPathForRole(claims.role), req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pending-approval", "/login", "/register"],
};
