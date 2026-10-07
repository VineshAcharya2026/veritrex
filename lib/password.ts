import bcrypt from "bcryptjs";

/** Lower cost keeps bcrypt.verify within Cloudflare Worker CPU limits. */
export const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/** Re-hash legacy cost-12 (or higher) hashes after a successful login. */
export function needsBcryptUpgrade(hash: string): boolean {
  const match = /^\$2[aby]\$(\d+)\$/.exec(hash);
  if (!match) return false;
  const cost = Number.parseInt(match[1], 10);
  return Number.isFinite(cost) && cost > BCRYPT_ROUNDS;
}
