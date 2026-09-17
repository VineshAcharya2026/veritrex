import { isCloudflareWorker } from "@/lib/platform";

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  meta?: { changes?: number; last_row_id?: number };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface KVNamespace {
  get(
    key: string,
    options?: { type?: "text" | "json" | "arrayBuffer" | "stream" }
  ): Promise<string | ArrayBuffer | ReadableStream | null>;
  getWithMetadata(
    key: string,
    type: "arrayBuffer"
  ): Promise<{ value: ArrayBuffer | null; metadata: Record<string, unknown> | null }>;
  put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
    options?: { expirationTtl?: number; metadata?: Record<string, unknown> }
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

function getCloudflareEnv(): CloudflareEnv {
  if (isCloudflareWorker()) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    return getCloudflareContext().env as CloudflareEnv;
  }

  // Local Next.js dev — wrangler/miniflare may expose bindings via global
  const globalEnv = (globalThis as { TRUSTHIRE_ENV?: CloudflareEnv }).TRUSTHIRE_ENV;
  if (globalEnv?.DB) return globalEnv;

  throw new Error(
    "D1 database not available. Run with wrangler/OpenNext or set TRUSTHIRE_ENV for local dev."
  );
}

export function getDb(): D1Database {
  const env = getCloudflareEnv();
  if (!env.DB) {
    throw new Error("D1 binding DB is not configured in wrangler.toml");
  }
  return env.DB;
}

export function getAuthKv(): KVNamespace | null {
  try {
    const env = getCloudflareEnv();
    return env.AUTH_KV ?? null;
  } catch {
    return null;
  }
}
