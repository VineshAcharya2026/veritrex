import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { sendOutboundEmail } from "@/lib/smtp-send";

const schema = z.object({
  recipient: z.string().trim().email(),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
});

/** Super Admin SMTP smoke test — not for public use. */
export async function POST(request: Request) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid recipient, subject, and body required" }, { status: 400 });
  }

  const { recipient, subject, body } = parsed.data;
  const result = await sendOutboundEmail({
    to: recipient,
    subject,
    text: body,
  });

  if (!result.ok) {
    if (result.error === "email_not_configured") {
      return NextResponse.json({ error: "SMTP not configured (set SMTP_PASS on Worker)" }, { status: 503 });
    }
    return NextResponse.json({ error: "Send failed — check Worker logs" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
