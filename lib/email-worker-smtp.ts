import { sendCpanelSmtp } from "@/lib/cpanel-smtp-worker";

/** Worker-only SMTP send — uses Cloudflare TCP sockets (cPanel port 465). */
export async function sendMailWorkerSmtp(
  config: {
    host: string;
    port: number;
    username: string;
    password: string;
    from: string;
    to: string | string[];
    heloName?: string;
    messageIdDomain?: string;
  },
  message: { subject: string; replyTo?: string; text: string; html?: string }
): Promise<void> {
  await sendCpanelSmtp(config, message);
}
