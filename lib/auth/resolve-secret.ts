import { AUTH_SECRET_ENV, LEGACY_AUTH_SECRET_ENV } from "@/lib/auth/constants";
import { isCloudflareWorker } from "@/lib/platform";

function readWorkerEnvString(key: string): string | undefined {
  if (!isCloudflareWorker()) return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as Record<string, string | undefined>;
    const value = env[key]?.trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

/** JWT signing secret — Workers bindings first, then Node process.env. */
export function resolveAuthSecret(): string {
  const fromBinding =
    readWorkerEnvString("AUTH_SECRET") ?? readWorkerEnvString("NEXTAUTH_SECRET");
  if (fromBinding) return fromBinding;

  const secret =
    process.env[AUTH_SECRET_ENV]?.trim() ||
    process.env[LEGACY_AUTH_SECRET_ENV]?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) is not configured");
  }
  return secret;
}
