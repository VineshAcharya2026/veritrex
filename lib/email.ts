import nodemailer from "nodemailer";
import { formatCurrency } from "@/lib/utils";
import { readWorkerEnvString } from "@/lib/worker-env";

function env(key: string): string | undefined {
  const v = readWorkerEnvString(key) ?? process.env[key]?.trim();
  return v || undefined;
}

function defaultFrom(): string {
  return env("EMAIL_FROM") || "Veritrex <noreply@veritrex.org>";
}

function getTransporter() {
  const host = env("SMTP_HOST");
  const pass = env("SMTP_PASS");
  if (!host || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(env("SMTP_PORT") || "587", 10),
    auth: {
      user: env("SMTP_USER"),
      pass,
    },
  });
}

async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey) return false;

  const from = defaultFrom();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[email] Resend failed", res.status, text);
    return false;
  }
  return true;
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;
  await transporter.sendMail({
    from: defaultFrom(),
    to,
    subject,
    html,
  });
  return true;
}

async function send(to: string, subject: string, html: string) {
  if (await sendViaResend(to, subject, html)) return;
  if (await sendViaSmtp(to, subject, html)) return;
  console.log(`[email stub] To: ${to} | ${subject}`);
  if (html.includes("href=")) {
    const match = html.match(/href="([^"]+)"/);
    if (match?.[1]) console.log(`[email stub] Link: ${match[1]}`);
  }
}

export async function sendReferralConfirmation(
  referrerEmail: string,
  candidateEmail: string,
  jobTitle: string
) {
  await send(
    referrerEmail,
    `Referral submitted: ${jobTitle}`,
    `<p>Your referral for <strong>${jobTitle}</strong> has been submitted successfully.</p>`
  );
  await send(
    candidateEmail,
    `You've been referred for ${jobTitle}`,
    `<p>A referrer has submitted your profile for <strong>${jobTitle}</strong> on Veritrex.</p>`
  );
}

export async function sendStatusUpdate(
  candidateEmail: string,
  referrerEmail: string,
  newStatus: string,
  jobTitle: string
) {
  const html = `<p>Referral status updated to <strong>${newStatus}</strong> for <strong>${jobTitle}</strong>.</p>`;
  await send(referrerEmail, `Status update: ${jobTitle}`, html);
  await send(candidateEmail, `Application update: ${jobTitle}`, html);
}

export async function sendRewardLocked(
  referrerEmail: string,
  amount: number,
  jobTitle: string
) {
  await send(
    referrerEmail,
    `Reward locked: ${formatCurrency(amount)} for ${jobTitle}`,
    `<p>Congratulations! A reward of <strong>${formatCurrency(amount)}</strong> has been locked for your hire on <strong>${jobTitle}</strong>.</p>`
  );
}

export async function sendMilestoneReached(
  referrerEmail: string,
  amount: number,
  dayMark: number
) {
  await send(
    referrerEmail,
    `Milestone payout: Day ${dayMark}`,
    `<p>Your Day ${dayMark} retention milestone payout of <strong>${formatCurrency(amount)}</strong> is being processed.</p>`
  );
}

export async function sendRetentionReminder(
  employerEmail: string,
  candidateName: string,
  dayMark: number
) {
  await send(
    employerEmail,
    `Retention check: ${candidateName} — Day ${dayMark}`,
    `<p>Please confirm retention for <strong>${candidateName}</strong> at the Day ${dayMark} milestone.</p>`
  );
}

export async function sendAdminAlert(subject: string, body: string) {
  const adminEmail = env("ADMIN_ALERT_EMAIL");
  if (!adminEmail) {
    console.log(`[admin alert] ${subject}: ${body}`);
    return;
  }
  await send(adminEmail, subject, `<p>${body}</p>`);
}

export async function sendRegistrationConfirmation(email: string, firstName: string) {
  await send(
    email,
    `Welcome to ${env("BRAND_NAME") || "Veritrex"}`,
    `<p>Hi ${firstName},</p><p>Your ${env("BRAND_NAME") || "Veritrex"} account is ready. Sign in anytime to complete your profile and start connecting.</p>`
  );
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await send(
    email,
    "Reset your password",
    `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in one hour.</p><p>If you did not request this, you can ignore this email.</p>`
  );
}
