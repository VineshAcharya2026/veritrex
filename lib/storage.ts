import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { getAuthKv } from "@/lib/db/client";
import { isCloudflareWorker } from "@/lib/platform";

export type UploadResult = {
  fileUrl: string;
  storageKey: string;
};

const MEDIA_KV_PREFIX = "media:";
/** KV values max out at 25 MiB; keep headroom under the hard limit. */
export const MAX_KV_OBJECT_BYTES = 20 * 1024 * 1024;

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

function mediaPublicUrl(storageKey: string): string {
  return `/api/media/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
}

function kvKey(storageKey: string): string {
  return `${MEDIA_KV_PREFIX}${storageKey}`;
}

/** True when R2, KV, or local disk can accept uploads. */
export function isStorageConfigured(): boolean {
  if (getMentorContentBucket() && process.env.R2_PUBLIC_URL?.trim()) return true;
  if (getAuthKv()) return true;
  // Local next dev fallback
  return !isCloudflareWorker();
}

export function isR2Configured(): boolean {
  return Boolean(getMentorContentBucket() && process.env.R2_PUBLIC_URL?.trim());
}

export function isKvMediaConfigured(): boolean {
  return Boolean(getAuthKv());
}

async function uploadLocal(
  key: string,
  data: ArrayBuffer | Uint8Array,
  _contentType: string
): Promise<UploadResult> {
  const safeKey = key.replace(/\\/g, "/").replace(/\.\./g, "");
  const abs = join(process.cwd(), "public", "uploads", safeKey);
  const dir = join(abs, "..");
  await mkdir(dir, { recursive: true });
  const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
  await writeFile(abs, buffer);
  return {
    fileUrl: `/uploads/${safeKey}`,
    storageKey: `local:${safeKey}`,
  };
}

async function uploadToKv(
  key: string,
  data: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<UploadResult> {
  const kv = getAuthKv();
  if (!kv) throw new Error("KV storage is not available.");

  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.byteLength > MAX_KV_OBJECT_BYTES) {
    throw new Error(
      `File too large for KV storage (max ${Math.floor(MAX_KV_OBJECT_BYTES / (1024 * 1024))}MB).`
    );
  }

  await kv.put(kvKey(key), bytes, {
    metadata: { contentType },
  });

  return {
    fileUrl: mediaPublicUrl(key),
    storageKey: `kv:${key}`,
  };
}

export async function uploadPublicFile(
  key: string,
  data: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<UploadResult> {
  const bucket = getMentorContentBucket();
  if (bucket && process.env.R2_PUBLIC_URL?.trim()) {
    await bucket.put(key, data, {
      httpMetadata: { contentType },
    });
    return {
      fileUrl: `${requirePublicBaseUrl()}/${key}`,
      storageKey: key,
    };
  }

  // Production Workers without R2: store in AUTH_KV and serve via /api/media
  if (isCloudflareWorker() && getAuthKv()) {
    return uploadToKv(key, data, contentType);
  }

  return uploadLocal(key, data, contentType);
}

export async function getKvMediaObject(
  storageKey: string
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const kv = getAuthKv();
  if (!kv) return null;

  const key = storageKey.startsWith(MEDIA_KV_PREFIX)
    ? storageKey
    : kvKey(storageKey);

  const result = await kv.getWithMetadata(key, "arrayBuffer");
  if (!result?.value) return null;

  const meta = result.metadata as { contentType?: string } | null;
  return {
    body: result.value,
    contentType: meta?.contentType || "application/octet-stream",
  };
}

export async function deleteStoredFile(key: string): Promise<void> {
  if (key.startsWith("local:")) {
    try {
      const { unlink } = await import("node:fs/promises");
      const rel = key.slice("local:".length);
      await unlink(join(process.cwd(), "public", "uploads", rel));
    } catch {
      // may already be gone
    }
    return;
  }

  if (key.startsWith("data:")) {
    return;
  }

  if (key.startsWith("kv:")) {
    const kv = getAuthKv();
    if (!kv) return;
    try {
      await kv.delete(kvKey(key.slice("kv:".length)));
    } catch {
      // may already be gone
    }
    return;
  }

  const bucket = getMentorContentBucket();
  if (!bucket) return;

  try {
    await bucket.delete(key);
  } catch {
    // object may already be deleted
  }
}

export function uniqueUploadName(originalName: string): string {
  const ext = originalName.includes(".")
    ? originalName.slice(originalName.lastIndexOf("."))
    : "";
  return `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
}
