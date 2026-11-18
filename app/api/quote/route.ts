import tls from "node:tls";
import { Resend } from "resend";
import mailLogo from "@/data/mail/itsbio-logo.json";

export const runtime = "nodejs";
export const preferredRegion = "icn1";
export const maxDuration = 30;

const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 5;
const MAILPLUG_SMTP_HOST = "smtp.mailplug.co.kr";
const MAILPLUG_SMTP_PORT = 465;
const DEFAULT_SMTP_USER = "bclim@itsbio.co.kr";
const DEFAULT_TO_EMAIL = "info@itsbio.co.kr";
const DEFAULT_FROM_EMAIL = "info@itsbio.co.kr";
const requestLog = new Map<string, number[]>();

function clean(value: unknown, maxLength: number) {
  return String(value ?? "").replace(/\0/g, "").trim().slice(0, maxLength);
}

function oneLine(value: unknown, maxLength: number) {
  return clean(value, maxLength).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function clientIp(req: Request) {
  return clean(req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown", 80);
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((timestamp) => now - timestamp < REQUEST_WINDOW_MS);
  if (recent.length >= REQUEST_LIMIT) {
    requestLog.set(ip, recent);
    return true;
  }
  requestLog.set(ip, [...recent, now]);
  return false;
}

type SmtpResponse = { code: number; text: string };
type SmtpStage =
  | "connection"
  | "greeting"
  | "ehlo"
  | "auth-method"
  | "auth-username"
  | "auth-password"
  | "sender"
  | "recipient"
  | "data"
  | "delivery";

class MailplugSmtpError extends Error {
  stage: SmtpStage;
  status?: number;

  constructor(stage: SmtpStage, message: string, status?: number) {
    super(message);
    this.name = "MailplugSmtpError";
    this.stage = stage;
    this.status = status;
  }
}

function createResponseReader(socket: tls.TLSSocket) {
  let buffer = "";
  let current: string[] = [];
  const queued: SmtpResponse[] = [];
  const waiters: Array<{ resolve: (response: SmtpResponse) => void; reject: (error: Error) => void }> = [];
  let terminalError: Error | null = null;

  const deliver = (response: SmtpResponse) => {
    const waiter = waiters.shift();
    if (waiter) waiter.resolve(response);
    else queued.push(response);
  };

  const fail = (error: Error) => {
    terminalError = error;
    while (waiters.length) waiters.shift()?.reject(error);
  };

  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let lineEnd = buffer.indexOf("\n");
    while (lineEnd >= 0) {
      const line = buffer.slice(0, lineEnd + 1).replace(/\r?\n$/, "");
      buffer = buffer.slice(lineEnd + 1);
      current.push(line);
      const match = line.match(/^(\d{3})([ -])/);
      if (match?.[2] === " ") {
        deliver({ code: Number.parseInt(match[1], 10), text: current.join("\n") });
        current = [];
      }
      lineEnd = buffer.indexOf("\n");
    }
  });

  socket.on("error", fail);
  socket.on("close", () => {
    if (waiters.length) fail(new Error("Mailplug SMTP connection closed unexpectedly."));
  });

  return () => new Promise<SmtpResponse>((resolve, reject) => {
    if (queued.length) {
      resolve(queued.shift()!);
      return;
    }
    if (terminalError) {
      reject(terminalError);
      return;
    }
    waiters.push({ resolve, reject });
  });
}

function expect(response: SmtpResponse, accepted: number[], stage: SmtpStage) {
  if (!accepted.includes(response.code)) {
    throw new MailplugSmtpError(stage, `Mailplug SMTP ${stage} failed with status ${response.code}.`, response.code);
  }
}

function encodedSubject(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function smtpBody(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

function mimeBase64(value: string) {
  const canonical = value.replace(/\r\n|\r|\n/g, "\r\n");
  return Buffer.from(canonical, "utf8").toString("base64").match(/.{1,76}/g)?.join("\r\n") || "";
}

function escapeHtml(value: string) {
  const replacements: Record<string, string> = {
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => replacements[character]);
}

type InquiryDetails = {
  name: string; org: string; field: string; department: string; inquiryType: string;
  email: string; phone: string; product: string; catNo: string; quantity: string;
  configuration: string; message: string;
};

function inquiryEmail(details: InquiryDetails) {
  const contact = [
    ["Name", details.name], ["Org", details.org], ["Field", details.field],
    ["Department", details.department], ["Inquiry type", details.inquiryType],
    ["Email", details.email], ["Phone", details.phone],
  ].filter(([, value]) => value);
  const product = [
    ["Product name", details.product], ["Cat No", details.catNo],
    ["Quantity", details.quantity], ["Model / specification", details.configuration],
  ].filter(([, value]) => value);
  const textSection = (title: string, rows: string[][]) =>
    [title, ...rows.map(([label, value]) => `${label}: ${value}`)].join("\n\n");
  const text = [
    "ITSBio | 견적 문의",
    textSection("Contact information", contact),
    ...(product.length ? [textSection("Product information", product)] : []),
    `Message:\n\n${details.message}`,
  ].join("\n\n\n");

  const htmlSection = (title: string, rows: string[][]) => `<tr><td style="padding:24px;border-top:1px solid #e2e8f0;">
    <h2 style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">${title}</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.map(([label, value]) => `<tr><td style="padding:0 0 12px;font-size:16px;line-height:1.6;overflow-wrap:anywhere;word-break:break-word;"><strong>${label}:</strong> ${label === "Email" ? `<a href="mailto:${escapeHtml(value)}" style="color:#0b5baa;text-decoration:underline;">${escapeHtml(value)}</a>` : escapeHtml(value)}</td></tr>`).join("")}</table>
  </td></tr>`;
  const html = `<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>견적 문의 | ITSBio</title></head>
<body style="margin:0;padding:0;background-color:#f5f6f8;color:#172033;font-family:Arial,'Malgun Gothic',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;background-color:#ffffff;border:1px solid #e2e8f0;">
<tr><td style="padding:24px;"><img src="cid:${mailLogo.contentId}" alt="ITSBio" width="${mailLogo.width}" height="${mailLogo.height}" style="display:block;width:${mailLogo.width}px;height:${mailLogo.height}px;border:0;margin:0 0 16px;"><h1 style="margin:0;font-size:22px;line-height:1.4;">견적 문의</h1></td></tr>
${htmlSection("Contact information", contact)}
${product.length ? htmlSection("Product information", product) : ""}
<tr><td style="padding:24px;border-top:1px solid #e2e8f0;"><h2 style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">Message</h2>
<p style="margin:0;font-size:16px;line-height:1.8;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(details.message).replace(/\r\n|\r|\n/g, "<br>")}</p></td></tr>
</table></td></tr></table></body></html>`;
  return { text, html };
}

function advertisedAuthMethods(ehlo: SmtpResponse) {
  const match = ehlo.text.match(/(?:^|\n)250[- ]AUTH\s+([^\r\n]+)/i);
  return match ? match[1].toUpperCase().split(/\s+/).filter(Boolean) : [];
}

async function sendMailplugEmail({
  username,
  password,
  from,
  to,
  replyTo,
  subject,
  text,
  html,
}: {
  username: string;
  password: string;
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}) {
  const socket = tls.connect({
    host: MAILPLUG_SMTP_HOST,
    port: MAILPLUG_SMTP_PORT,
    servername: MAILPLUG_SMTP_HOST,
    rejectUnauthorized: true,
  });
  const nextResponse = createResponseReader(socket);
  socket.setTimeout(25_000, () => socket.destroy(new Error("Mailplug SMTP connection timed out.")));

  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("secureConnect", resolve);
      socket.once("error", reject);
    });
  } catch (error) {
    socket.destroy();
    throw new MailplugSmtpError("connection", error instanceof Error ? error.message : "Mailplug SMTP connection failed.");
  }

  const command = async (value: string, accepted: number[], stage: SmtpStage) => {
    const pending = nextResponse();
    socket.write(`${value}\r\n`);
    const response = await pending;
    expect(response, accepted, stage);
    return response;
  };

  try {
    expect(await nextResponse(), [220], "greeting");
    const ehlo = await command("EHLO itsbio.co.kr", [250], "ehlo");
    const methods = advertisedAuthMethods(ehlo);

    // AUTH PLAIN sends the username and password in one authenticated TLS exchange,
    // reducing round trips compared with AUTH LOGIN when the server advertises it.
    if (methods.includes("PLAIN")) {
      const authPlain = Buffer.from(`\u0000${username}\u0000${password}`, "utf8").toString("base64");
      await command(`AUTH PLAIN ${authPlain}`, [235], "auth-password");
    } else if (methods.includes("LOGIN") || methods.length === 0) {
      await command("AUTH LOGIN", [334], "auth-method");
      await command(Buffer.from(username, "utf8").toString("base64"), [334], "auth-username");
      await command(Buffer.from(password, "utf8").toString("base64"), [235], "auth-password");
    } else {
      throw new MailplugSmtpError("auth-method", "Mailplug SMTP did not advertise a supported authentication method.");
    }

    await command(`MAIL FROM:<${from}>`, [250], "sender");
    await command(`RCPT TO:<${to}>`, [250, 251], "recipient");
    await command("DATA", [354], "data");

    const boundary = `itsbio_${crypto.randomUUID()}`;
    const relatedBoundary = `itsbio_logo_${crypto.randomUUID()}`;
    const alternative = [
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      mimeBase64(text),
      `--${boundary}`,
      `Content-Type: multipart/related; boundary="${relatedBoundary}"; type="text/html"`,
      "",
      `--${relatedBoundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      mimeBase64(html),
      `--${relatedBoundary}`,
      `Content-Type: ${mailLogo.contentType}; name="${mailLogo.filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-ID: <${mailLogo.contentId}>`,
      `Content-Disposition: inline; filename="${mailLogo.filename}"`,
      "",
      mailLogo.content.match(/.{1,76}/g)?.join("\r\n") || "",
      `--${relatedBoundary}--`,
      `--${boundary}--`,
    ].join("\r\n");
    const message = [
      `From: ITSBio <${from}>`,
      `To: ${to}`,
      `Reply-To: ${replyTo}`,
      `Subject: ${encodedSubject(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      smtpBody(alternative),
    ].join("\r\n");

    const accepted = nextResponse();
    socket.write(`${message}\r\n.\r\n`);
    expect(await accepted, [250], "delivery");

    // Delivery is confirmed by the 250 response above. Do not hold the UI open
    // for the optional QUIT acknowledgement.
    socket.write("QUIT\r\n");
  } catch (error) {
    if (error instanceof MailplugSmtpError) throw error;
    throw new MailplugSmtpError("connection", error instanceof Error ? error.message : "Mailplug SMTP failed.");
  } finally {
    socket.end();
  }
}

async function sendResendFallback({ from, to, replyTo, subject, text, html }: { from: string; to: string; replyTo: string; subject: string; text: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.QUOTE_FROM_EMAIL || `ITSBio <${from}>`,
    to: [to],
    subject,
    text,
    html,
    replyTo,
    attachments: [{ filename: mailLogo.filename, content: mailLogo.content, contentType: mailLogo.contentType, contentId: mailLogo.contentId }],
  });

  if (error) {
    console.error("Resend fallback failed:", error.message);
    return false;
  }
  return true;
}

function publicMailError(error: unknown, smtpUser: string) {
  if (!(error instanceof MailplugSmtpError)) return "Mail delivery failed before completion.";
  const status = error.status ? ` (SMTP ${error.status})` : "";
  if (error.stage === "auth-method") return `Mailplug rejected the SMTP authentication method${status}.`;
  if (error.stage === "auth-username") return `Mailplug rejected the SMTP username${status}. Expected account: ${smtpUser}.`;
  if (error.stage === "auth-password") return `Mailplug rejected the SMTP app password${status} for ${smtpUser}.`;
  if (error.stage === "connection" || error.stage === "greeting" || error.stage === "ehlo") {
    return `Mailplug SMTP connection failed${status}. Please try again shortly.`;
  }
  return `Mailplug SMTP failed during ${error.stage}${status}.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (clean(body.website, 200)) {
      return Response.json({ ok: true });
    }

    if (isRateLimited(clientIp(req))) {
      return Response.json({ ok: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const name = oneLine(body.name, 100);
    const org = oneLine(body.org, 150);
    const field = oneLine(body.field, 100);
    const department = oneLine(body.department, 150);
    const inquiryType = oneLine(body.inquiryType, 100);
    const email = oneLine(body.email, 254).toLowerCase();
    const phone = oneLine(body.phone, 50);
    const product = oneLine(body.product, 300);
    const catNo = oneLine(body.catNo, 150);
    const rawQuantity = clean(body.quantity, 30);
    const quantityNumber = Number(rawQuantity);
    if (rawQuantity && (!Number.isSafeInteger(quantityNumber) || quantityNumber < 1 || quantityNumber > 999999)) {
      return Response.json({ ok: false, error: "Quantity must be a whole number between 1 and 999999." }, { status: 400 });
    }
    const quantity = rawQuantity ? String(quantityNumber) : "";
    const configuration = oneLine(body.configuration, 500);
    const message = clean(body.message, 5000);
    const privacyAccepted = body.privacyAccepted === true;

    if (!validEmail(email) || !message || !privacyAccepted) {
      return Response.json({ ok: false, error: "A valid email, message, and privacy agreement are required." }, { status: 400 });
    }

    const smtpUser = oneLine(process.env.MAILPLUG_SMTP_USER || DEFAULT_SMTP_USER, 254).toLowerCase();
    const smtpPassword = String(process.env.MAILPLUG_SMTP_PASSWORD || "").replace(/\s+/g, "");
    const toEmail = oneLine(process.env.QUOTE_TO_EMAIL || DEFAULT_TO_EMAIL, 254).toLowerCase();
    // A representative address may differ from the authenticated member account.
    const fromEmail = oneLine(process.env.MAILPLUG_FROM_EMAIL || DEFAULT_FROM_EMAIL, 254).toLowerCase();

    if (!validEmail(smtpUser) || !smtpPassword || !validEmail(toEmail) || !validEmail(fromEmail)) {
      console.error("Quote email is not configured: Mailplug SMTP credentials are incomplete.");
      return Response.json({ ok: false, error: "The message service is temporarily unavailable because SMTP credentials are incomplete." }, { status: 503 });
    }

    const subject = `[견적서] ${product || catNo || "General inquiry"} - ${name || "Unknown"}`;
    const { text, html } = inquiryEmail({ name, org, field, department, inquiryType, email, phone, product, catNo, quantity, configuration, message });

    try {
      await sendMailplugEmail({ username: smtpUser, password: smtpPassword, from: fromEmail, to: toEmail, replyTo: email, subject, text, html });
      return Response.json({ ok: true, provider: "mailplug" });
    } catch (mailplugError) {
      console.error("Mailplug quote delivery failed:", mailplugError instanceof Error ? mailplugError.message : mailplugError);
      if (await sendResendFallback({ from: fromEmail, to: toEmail, replyTo: email, subject, text, html })) {
        return Response.json({ ok: true, provider: "resend-fallback" });
      }
      return Response.json({ ok: false, error: publicMailError(mailplugError, smtpUser) }, { status: 502 });
    }
  } catch (error) {
    console.error("Quote request failed:", error);
    return Response.json({ ok: false, error: "We could not process your message." }, { status: 500 });
  }
}

