import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveContactInbox } from "@/lib/contact-inbox";
import { runAfterResponse } from "@/lib/background-task";
import { getSmtpSettings } from "@/lib/email-config";
import { sendOutboundEmail } from "@/lib/smtp-send";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email required"),
  message: z.string().trim().min(1, "Message is required").max(5000),
  website: z.string().optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, message, website } = parsed.data;
  if (website?.trim()) {
    return NextResponse.json({ ok: true });
  }

  if (!getSmtpSettings()) {
    console.error("[contact] SMTP not configured");
    return NextResponse.json(
      { error: "Email is temporarily unavailable. Please use phone or mailto." },
      { status: 503 }
    );
  }

  const subject = `Veritrex contact from ${name}`;
  const html = `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`;
  const text = `Name: ${name}\nEmail: ${email}\n\n${message}`;

  const payload = {
    to: resolveContactInbox(),
    subject,
    html,
    text,
    replyTo: email,
  };

  runAfterResponse(async () => {
    const result = await sendOutboundEmail(payload);
    if (!result.ok) {
      console.error(
        "[contact] background send failed",
        result.error,
        "detail" in result ? result.detail : ""
      );
    }
  });

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
