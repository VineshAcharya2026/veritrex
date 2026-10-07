import nodemailer from "nodemailer";
import { getSmtpSettings } from "@/lib/email-config";
import { htmlToPlainText } from "@/lib/email-html";
import { isCloudflareWorker } from "@/lib/platform";
import { readWorkerEnvString } from "@/lib/worker-env";
import { withTimeout } from "@/lib/background-task";

export type SendOutboundResult =
  | { ok: true }
  | { ok: false; error: "email_not_configured" | "send_failed"; detail?: string };

function envReplyTo(): string | undefined {
  const v = readWorkerEnvString("EMAIL_REPLY_TO") ?? process.env.EMAIL_REPLY_TO?.trim();
  return v || undefined;
}

/**
 * Send mail via cPanel SMTP (Worker TCP or Nodemailer locally).
 * Does not use Resend — use lib/email.ts send() for transactional templates with Resend fallback.
 */
export async function sendOutboundEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}): Promise<SendOutboundResult> {
  const smtp = getSmtpSettings();
  if (!smtp) return { ok: false, error: "email_not_configured" };

  const html = options.html ?? (options.text ? `<p>${escapeHtml(options.text).replace(/\n/g, "<br/>")}</p>` : "");
  const text = options.text ?? htmlToPlainText(html);
  const replyTo = options.replyTo ?? envReplyTo();
  const smtpTimeoutMs = isCloudflareWorker() ? 18_000 : 30_000;

  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (isCloudflareWorker()) {
        const { sendMailWorkerSmtp } = await import("@/lib/email-worker-smtp");
        await withTimeout(
          sendMailWorkerSmtp(
            {
              host: smtp.host,
              port: smtp.port,
              username: smtp.user,
              password: smtp.pass,
              from: smtp.from,
              to: options.to,
              heloName: "veritrex.org",
              messageIdDomain: "veritrex.org",
            },
            {
              subject: options.subject,
              text,
              replyTo,
            }
          ),
          smtpTimeoutMs,
          "SMTP"
        );
        return { ok: true };
      }

      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.port === 465,
        auth: { user: smtp.user, pass: smtp.pass },
      });
      await withTimeout(
        transporter.sendMail({
          from: smtp.from,
          to: options.to,
          subject: options.subject,
          html: html || undefined,
          text,
          replyTo,
        }),
        smtpTimeoutMs,
        "SMTP"
      );
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[smtp-send] attempt", attempt, msg);
      if (attempt === maxAttempts) {
        return { ok: false, error: "send_failed", detail: msg };
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return { ok: false, error: "send_failed", detail: "exhausted retries" };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
