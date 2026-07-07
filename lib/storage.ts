export type UploadResult = {
  fileUrl: string;
  storageKey: string;
};

function getMentorContentBucket(): R2Bucket | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext() as { env: CloudflareEnv };
    return env.MENTOR_CONTENT;
  } catch {
    return undefined;
  }
}

function requirePublicBaseUrl(): string {
  const base = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!base) {
    throw new Error("R2_PUBLIC_URL is not configured.");
  }
  return base;
}

export function isStorageConfigured(): boolean {
  if (getMentorContentBucket()) return Boolean(process.env.R2_PUBLIC_URL?.trim());
  return false;
}

export async function uploadPublicFile(
  key: string,
  data: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<UploadResult> {
  const bucket = getMentorContentBucket();
  if (!bucket) {
    throw new Error(
      "R2 bucket not bound. Configure MENTOR_CONTENT in wrangler.toml and run via wrangler preview/deploy."
    );
  }

  await bucket.put(key, data, {
    httpMetadata: { contentType },
  });

  return {
    fileUrl: `${requirePublicBaseUrl()}/${key}`,
    storageKey: key,
  };
}

export async function deleteStoredFile(key: string): Promise<void> {
  const bucket = getMentorContentBucket();
  if (!bucket) return;

  try {
    await bucket.delete(key);
  } catch {
    // object may already be deleted
  }
}
