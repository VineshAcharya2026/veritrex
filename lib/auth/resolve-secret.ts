import { AUTH_SECRET_ENV, LEGACY_AUTH_SECRET_ENV } from "@/lib/auth/constants";
import { readWorkerEnvString, readWorkerEnvStringOptional } from "@/lib/worker-env";

/** JWT signing secret — Workers bindings first, then process.env. */
export function resolveAuthSecret(): string {
  const fromBinding = readWorkerEnvStringOptional(["AUTH_SECRET", "NEXTAUTH_SECRET"]);
  if (fromBinding) return fromBinding;

  const secret =
    process.env[AUTH_SECRET_ENV]?.trim() ||
    process.env[LEGACY_AUTH_SECRET_ENV]?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) is not configured");
  }
  return secret;
}

/** Cron bearer token — same resolution as auth secrets. */
export function resolveCronSecret(): string | undefined {
  return readWorkerEnvString("CRON_SECRET");
}
