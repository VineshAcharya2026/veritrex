import { BRAND } from "@/lib/brand";
import { readWorkerEnvString } from "@/lib/worker-env";

/** Public contact form and footer mailto — delivered via POST /api/contact. */
export const CONTACT_INBOX = BRAND.email;

export function resolveContactInbox(): string {
  return (
    readWorkerEnvString("CONTACT_TO")?.trim() ||
    process.env.CONTACT_TO?.trim() ||
    CONTACT_INBOX
  );
}
