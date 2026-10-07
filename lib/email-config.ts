import { readWorkerEnvString } from "@/lib/worker-env";

function env(key: string): string | undefined {
  const v = readWorkerEnvString(key) ?? process.env[key]?.trim();
  return v || undefined;
}

export function defaultEmailFrom(): string {
  return env("EMAIL_FROM") || "Veritrex <info@veritrex.org>";
}

export function getSmtpSettings():
  | { host: string; port: number; user: string; pass: string; from: string }
  | null {
  const host = env("SMTP_HOST");
  const pass = env("SMTP_PASS");
  const user = env("SMTP_USER");
  if (!host || !pass || !user) return null;
  const port = parseInt(env("SMTP_PORT") || "587", 10);
  return { host, port, user, pass, from: defaultEmailFrom() };
}

/** For health checks — never expose secret values. */
export function emailDeliveryMode(): "resend" | "smtp" | "none" {
  if (env("RESEND_API_KEY")) return "resend";
  if (getSmtpSettings()) return "smtp";
  return "none";
}

/** Safe diagnostic for /api/health (no secrets). */
export function emailDiagnostic():
  | "ok"
  | "missing_smtp_pass"
  | "missing_smtp_host_or_user"
  | "resend_only"
  | "unconfigured" {
  if (env("RESEND_API_KEY")) return "resend_only";
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  if (host && user && pass) return "ok";
  if (host && user && !pass) return "missing_smtp_pass";
  if (!host || !user) return "missing_smtp_host_or_user";
  return "unconfigured";
}
