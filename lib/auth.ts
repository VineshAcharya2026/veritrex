import { NextResponse } from "next/server";
import type { Role, UserStatus } from "@/lib/db/types";
import { getSession } from "@/lib/auth/session";

export { getSession };

export interface AuthSession {
  user: {
    id: string;
    email: string;
    role: Role;
    status: UserStatus;
    name?: string | null;
  };
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session: session as AuthSession };
}

export async function requireRole(roles: Role | Role[]) {
  const { error, session } = await requireAuth();
  if (error || !session) return { error, session: null };

  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }
  if (session.user.status !== "ACTIVE") {
    return {
      error: NextResponse.json({ error: "Account is not active" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

export async function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}

export { dashboardPathForRole } from "@/lib/auth/dashboard";
