import { z } from "zod";

const MAX_PHONE_DIGITS = 15;

/** Keep digits and a single leading +. Strips letters and other junk. Caps at 15 digits. */
export function sanitizePhoneInput(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  const hasPlus = cleaned.startsWith("+");
  const digits = cleaned.replace(/\+/g, "").slice(0, MAX_PHONE_DIGITS);
  return hasPlus ? `+${digits}` : digits;
}

/** Normalize phone for API payloads; empty becomes undefined. */
export function formatPhoneForApi(value: string | undefined | null): string | undefined {
  if (value == null) return undefined;
  const sanitized = sanitizePhoneInput(value.trim());
  return sanitized || undefined;
}

/** Digits only (no +), for length checks after sanitize. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valid phone: optional +, then 10–15 digits (E.164-ish).
 * Empty string is treated as missing (optional fields).
 */
export function isValidPhone(value: string | undefined | null): boolean {
  if (value == null) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const sanitized = sanitizePhoneInput(trimmed);
  const digits = phoneDigits(sanitized);
  if (digits.length < 10 || digits.length > 15) return false;
  return /^\+?\d{10,15}$/.test(sanitized);
}

export const PHONE_INVALID_MSG =
  "Enter a valid phone number (10–15 digits, optional + country code)";

/** Optional phone — empty/null becomes undefined; non-empty must be valid. */
export const optionalPhoneSchema = z.preprocess((raw) => {
  if (raw == null || raw === "") return undefined;
  const s = sanitizePhoneInput(String(raw).trim());
  return s || undefined;
}, z.string().refine(isValidPhone, { message: PHONE_INVALID_MSG }).optional());

/** Required phone. */
export const requiredPhoneSchema = z.preprocess((raw) => {
  if (raw == null) return "";
  return sanitizePhoneInput(String(raw).trim());
}, z.string().min(1, "Phone number is required").refine(isValidPhone, { message: PHONE_INVALID_MSG }));
