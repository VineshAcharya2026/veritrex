import type { Role, UserStatus } from "@/lib/db/types";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  name?: string | null;
}

export interface SessionClaims extends SessionUser {
  jti: string;
  iat: number;
  exp: number;
}

export interface AppSession {
  user: SessionUser;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}
