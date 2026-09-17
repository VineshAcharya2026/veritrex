/** Shared helpers for D1 row mapping. */

export function createId(): string {
  const ts = Date.now().toString(36);
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const rand = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
  return `c${ts}${rand}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseJsonArray<T = string>(value: unknown): T[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function stringifyJsonArray(value: unknown): string {
  if (value == null) return "[]";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function parseJsonObject<T extends Record<string, unknown>>(value: unknown): T | null {
  if (value == null || value === "") return null;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return null;
}

export function stringifyJsonObject(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function boolFromDb(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}

export function boolToDb(value: boolean | undefined | null): number {
  return value ? 1 : 0;
}

export function mapRow<T extends Record<string, unknown>>(
  row: Record<string, unknown>,
  arrayFields: string[] = [],
  boolFields: string[] = []
): T {
  const out: Record<string, unknown> = { ...row };
  for (const field of arrayFields) {
    out[field] = parseJsonArray(out[field] as string);
  }
  for (const field of boolFields) {
    out[field] = boolFromDb(out[field]);
  }
  return out as T;
}
