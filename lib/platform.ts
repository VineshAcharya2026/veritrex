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

/** Resolve the public app URL for auth callbacks and absolute links. */
export function resolveAppUrl(): string {
  const fromBinding = readWorkerEnvString("NEXTAUTH_URL");
  if (fromBinding) return fromBinding.replace(/\/$/, "");

  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const cf =
    process.env.CF_PAGES_URL?.trim() ||
    process.env.CLOUDFLARE_URL?.trim() ||
    process.env.WORKER_URL?.trim();
  if (cf) return cf.startsWith("http") ? cf.replace(/\/$/, "") : `https://${cf}`;

  return "http://localhost:3000";
}

/** True when running inside the Cloudflare Workers runtime. */
export function isCloudflareWorker(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    getCloudflareContext();
    return true;
  } catch {
    return false;
  }
}
