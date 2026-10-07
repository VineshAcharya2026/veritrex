/**
 * Minimal SMTP client for Cloudflare Workers (TLS port 465).
 * Vendored from cloudflare-smtp (MIT) — avoids bundling that package into OpenNext.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function encodeHeader(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

function normalizeAddress(address: string) {
  return address.trim();
}

function extractEnvelopeAddress(from: string) {
  const match = from.match(/<([^>]+)>/);
  return normalizeAddress(match?.[1] ?? from);
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function sanitizeBody(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n\./g, "\n..");
}

function toBase64(value: string) {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function getRecipients(to: string | string[]) {
  const recipients = Array.isArray(to) ? to : [to];
  const normalized = recipients.map(normalizeAddress).filter(Boolean);
  if (normalized.length === 0) throw new Error("At least one recipient is required");
  return normalized;
}

function buildMessage(
  config: {
    from: string;
    to: string | string[];
    host: string;
    messageIdDomain?: string;
  },
  message: { subject: string; replyTo?: string; text: string; html?: string }
) {
  const from = normalizeAddress(config.from);
  const recipients = getRecipients(config.to);
  const replyTo = message.replyTo ? sanitizeHeader(message.replyTo) : undefined;
  const subject = encodeHeader(sanitizeHeader(message.subject));
  const messageIdDomain = sanitizeHeader(config.messageIdDomain ?? config.host);
  const boundary = `b_${crypto.randomUUID().replace(/-/g, "")}`;
  const textBody = sanitizeBody(message.text);
  const htmlBody = message.html ? sanitizeBody(message.html) : undefined;

  const headers = [
    `From: ${from}`,
    `To: ${recipients.join(", ")}`,
    replyTo ? `Reply-To: ${replyTo}` : undefined,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${messageIdDomain}>`,
    "MIME-Version: 1.0",
  ].filter(Boolean);

  if (htmlBody) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    const parts = [
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      textBody,
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      htmlBody,
      `--${boundary}--`,
      "",
    ];
    return `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}\r\n`;
  }

  headers.push("Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: 8bit");
  return `${headers.join("\r\n")}\r\n\r\n${textBody}\r\n`;
}

type WorkerSocket = {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  startTls: () => WorkerSocket;
  close: () => void;
};

class SmtpSession {
  private buffer = "";
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private socket: WorkerSocket;

  constructor(socket: WorkerSocket) {
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }

  async readResponse(expectedCodes: number[]) {
    while (true) {
      const { value, done } = await this.reader.read();
      if (done && !this.buffer && !value) {
        throw new Error("SMTP connection closed unexpectedly");
      }
      if (value) this.buffer += decoder.decode(value, { stream: true });

      const lines = this.buffer.split("\r\n");
      let finalLineIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line && /^\d{3} /.test(line)) finalLineIdx = i;
      }

      if (finalLineIdx < 0) {
        if (done) {
          throw new Error(`SMTP incomplete response: ${this.buffer.slice(0, 240)}`);
        }
        continue;
      }

      const finalLine = lines[finalLineIdx]!;
      const code = Number(finalLine.slice(0, 3));
      const response = lines.slice(0, finalLineIdx + 1).join("\r\n");
      this.buffer = lines.slice(finalLineIdx + 1).join("\r\n");

      if (!expectedCodes.includes(code)) {
        throw new Error(`SMTP error ${code}: ${response}`);
      }
      return response;
    }
  }

  async command(command: string, expectedCodes: number[]) {
    await this.writer.write(encoder.encode(`${command}\r\n`));
    return this.readResponse(expectedCodes);
  }

  async writeData(data: string) {
    await this.writer.write(encoder.encode(data));
  }

  async close() {
    try {
      await this.command("QUIT", [221]);
    } finally {
      this.reader.releaseLock();
      this.writer.releaseLock();
      this.socket.close();
    }
  }
}

export async function sendCpanelSmtp(
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
) {
  const { connect } = await import(/* webpackIgnore: true */ "cloudflare:sockets");
  const session = new SmtpSession(
    connect(
      { hostname: config.host, port: config.port },
      { secureTransport: "on" as const }
    ) as WorkerSocket
  );

  const envelopeFrom = extractEnvelopeAddress(config.from);
  const recipients = getRecipients(config.to);
  const heloName = sanitizeHeader(config.heloName ?? "veritrex.org");

  try {
    await session.readResponse([220]);
    await session.command(`EHLO ${heloName}`, [250]);
    await session.command("AUTH LOGIN", [334]);
    await session.command(toBase64(config.username), [334]);
    await session.command(toBase64(config.password), [235]);
    await session.command(`MAIL FROM:<${envelopeFrom}>`, [250]);
    for (const recipient of recipients) {
      await session.command(`RCPT TO:<${recipient}>`, [250, 251]);
    }
    await session.command("DATA", [354]);
    await session.writeData(
      `${buildMessage(
        {
          from: config.from,
          to: config.to,
          host: config.host,
          messageIdDomain: config.messageIdDomain,
        },
        message
      )}\r\n.\r\n`
    );
    await session.readResponse([250]);
  } finally {
    await session.close();
  }
}
