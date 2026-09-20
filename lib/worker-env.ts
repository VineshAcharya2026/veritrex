/**
 * Read Wrangler secrets / vars from the Cloudflare request context when available.
 * Falls back to process.env (populated by OpenNext on Workers after init).
 */
export function readWorkerEnvString(key: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as Record<string, string | undefined>;
    const fromBinding = env[key]?.trim();
    if (fromBinding) return fromBinding;
  } catch {
    // Not in Workers runtime or context not initialized yet
  }

  const fromProcess = process.env[key]?.trim();
  return fromProcess || undefined;
}

export function readWorkerEnvStringOptional(keys: string[]): string | undefined {
  for (const key of keys) {
    const value = readWorkerEnvString(key);
    if (value) return value;
  }
  return undefined;
}
