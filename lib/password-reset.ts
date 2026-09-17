import { getAuthKv } from "@/lib/db/client";
import { createId } from "@/lib/db/helpers";
import { sendPasswordResetEmail, sendRegistrationConfirmation } from "@/lib/email";

const RESET_PREFIX = "pwd-reset:";
const RESET_TTL_SECONDS = 60 * 60;

export async function createPasswordResetToken(userId: string, email: string): Promise<string | null> {
  const kv = getAuthKv();
  if (!kv) return null;

  const token = createId();
  await kv.put(
    `${RESET_PREFIX}${token}`,
    JSON.stringify({ userId, email, createdAt: Date.now() }),
    { expirationTtl: RESET_TTL_SECONDS }
  );
  return token;
}

export async function consumePasswordResetToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  const kv = getAuthKv();
  if (!kv) return null;

  const raw = await kv.get(`${RESET_PREFIX}${token}`);
  if (!raw || typeof raw !== "string") return null;

  try {
    const data = JSON.parse(raw) as { userId: string; email: string };
    if (!data.userId || !data.email) return null;
    await kv.delete(`${RESET_PREFIX}${token}`);
    return data;
  } catch {
    return null;
  }
}

export async function sendPasswordResetLink(email: string, token: string, origin: string) {
  const url = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
  await sendPasswordResetEmail(email, url);
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  await sendRegistrationConfirmation(email, firstName);
}
