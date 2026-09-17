import nodemailer from "nodemailer";
import { formatCurrency } from "@/lib/utils";

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function send(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email stub] To: ${to} | ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "Veritrex <info@veritrex.com>",
    to,
    subject,
    html,
  });
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
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail) {
    console.log(`[admin alert] ${subject}: ${body}`);
    return;
  }
  await send(adminEmail, subject, `<p>${body}</p>`);
}

export async function sendRegistrationConfirmation(email: string, firstName: string) {
  await send(
    email,
    `Welcome to ${process.env.BRAND_NAME || "Veritrex"}`,
    `<p>Hi ${firstName},</p><p>Your ${process.env.BRAND_NAME || "Veritrex"} account is ready. Sign in anytime to complete your profile and start connecting.</p>`
  );
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await send(
    email,
    "Reset your password",
    `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Click here to choose a new password</a>. This link expires in one hour.</p><p>If you did not request this, you can ignore this email.</p>`
  );
}
