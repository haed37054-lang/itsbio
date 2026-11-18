// Exercise the real API handler with both mail transports replaced in memory.
// No credentials are read and no network connections or emails are made.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../app/api/quote/route.ts", import.meta.url), "utf8"))
  .replace('import tls from "node:tls";', "const tls = dependencies.tls;")
  .replace('import { Resend } from "resend";', "const Resend = dependencies.Resend;")
  .replace(/^export /gm, "");

function createHandler(fallback = false, envOverrides = {}) {
  const smtpCommands = [];
  const smtpMessages = [];
  const fallbackMessages = [];
  const tls = {
    connect() {
      if (fallback) throw new Error("Simulated SMTP failure");
      const socket = new EventEmitter();
      socket.setTimeout = () => socket;
      socket.end = () => socket;
      socket.destroy = () => socket;
      socket.write = (command) => {
        smtpCommands.push(command);
        let response;
        if (command.startsWith("EHLO")) response = "250-test\r\n250 AUTH PLAIN\r\n";
        else if (command.startsWith("AUTH PLAIN")) response = "235 Authenticated\r\n";
        else if (command.startsWith("MAIL FROM") || command.startsWith("RCPT TO")) response = "250 OK\r\n";
        else if (command === "DATA\r\n") response = "354 Send message\r\n";
        else if (command.startsWith("From:")) {
          smtpMessages.push(command);
          response = "250 Accepted\r\n";
        }
        if (response) queueMicrotask(() => socket.emit("data", Buffer.from(response)));
      };
      queueMicrotask(() => {
        socket.emit("secureConnect");
        socket.emit("data", Buffer.from("220 Ready\r\n"));
      });
      return socket;
    },
  };
  class Resend {
    emails = { send: async (message) => { fallbackMessages.push(message); return { error: null }; } };
  }
  const handler = new Function("dependencies", "process", "console", `${source}\nreturn POST;`)(
    { tls, Resend },
    { env: { MAILPLUG_SMTP_USER: "sender@example.test", MAILPLUG_SMTP_PASSWORD: "dummy", QUOTE_TO_EMAIL: "recipient@example.test", RESEND_API_KEY: "dummy", ...envOverrides } },
    { error() {} },
  );
  return { handler, smtpMessages, fallbackMessages, smtpCommands };
}

const common = { name: "Test", org: "Example Lab", email: "visitor@example.test", phone: "010-0000-0000", message: "Please quote this product.", privacyAccepted: true, sourceUrl: "https://itsbio.co.kr/products/example" };
const product = { ...common, product: "Example instrument", catNo: "EX-001", configuration: "Selected model", quantity: "3" };
const footer = { ...common, field: "Life Science", department: "Research", inquiryType: "Product inquiry" };
const request = (body) => new Request("https://itsbio.co.kr/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

function smtpAlternatives(message) {
  const boundary = message.match(/Content-Type: multipart\/alternative; boundary="([^"]+)"/i)?.[1];
  assert.ok(boundary, "SMTP message must declare multipart/alternative");
  return message.split(`--${boundary}`).slice(1, -1).map((part) => {
    const [headers, encoded] = part.trim().split(/\r\n\r\n/);
    assert.match(headers, /Content-Transfer-Encoding: base64/i);
    for (const line of encoded.split("\r\n")) assert.ok(line.length <= 76, "MIME lines must fit 76 characters");
    return { type: headers.match(/Content-Type: ([^;]+)/i)[1], content: Buffer.from(encoded, "base64").toString("utf8").replace(/\r\n/g, "\n") };
  });
}

for (const fallback of [false, true]) {
  for (const [name, payload, expected] of [
    ["product inquiry", product, ["Product name: Example instrument", "Cat No: EX-001", "Quantity: 3", "Model / specification: Selected model"]],
    ["footer inquiry", footer, ["Field: Life Science", "Department: Research", "Inquiry type: Product inquiry"]],
  ]) {
    test(`${name} preserves information through ${fallback ? "fallback" : "SMTP"}`, async () => {
      const { handler, smtpMessages, fallbackMessages } = createHandler(fallback);
      const response = await handler(request(payload));
      assert.equal(response.status, 200);
      assert.equal((await response.json()).provider, fallback ? "resend-fallback" : "mailplug");
      assert.equal(smtpMessages.length + fallbackMessages.length, 1);
      const text = fallback ? fallbackMessages[0].text : smtpAlternatives(smtpMessages[0])[0].content;
      for (const value of [...expected, `Name: ${common.name}`, `Org: ${common.org}`, `Email: ${common.email}`, `Phone: ${common.phone}`, `Source page: ${common.sourceUrl}`, common.message]) {
        assert.ok(text.includes(value), `Missing ${value}`);
      }
      assert.ok(!text.includes("undefined"));
    });
  }
}

test("older clients can omit quantity", async () => {
  const { handler, smtpMessages } = createHandler();
  assert.equal((await handler(request(common))).status, 200);
  assert.equal(smtpMessages.length, 1);
  assert.ok(!smtpAlternatives(smtpMessages[0])[0].content.includes("Quantity:"));
});

test("quantity is validated on the server before sending", async () => {
  for (const quantity of ["0", "-1", "1.5", "1000000", "Infinity", "many"]) {
    const { handler, smtpMessages, fallbackMessages } = createHandler();
    assert.equal((await handler(request({ ...product, quantity }))).status, 400, quantity);
    assert.equal(smtpMessages.length + fallbackMessages.length, 0);
  }
});

test("optional inquiry fields stay on one line", async () => {
  const { handler, smtpMessages } = createHandler();
  assert.equal((await handler(request({ ...footer, department: "Research\r\nInjected: value" }))).status, 200);
  assert.ok(smtpAlternatives(smtpMessages[0])[0].content.includes("Department: Research Injected: value\n"));
});

test("privacy agreement remains required", async () => {
  const { handler, smtpMessages } = createHandler();
  assert.equal((await handler(request({ ...product, privacyAccepted: false }))).status, 400);
  assert.equal(smtpMessages.length, 0);
});


test("representative sender differs from SMTP login while retaining recipient and customer Reply-To", async () => {
  const { handler, smtpMessages, smtpCommands } = createHandler();
  assert.equal((await handler(request(product))).status, 200);
  const auth = smtpCommands.find((command) => command.startsWith("AUTH PLAIN "));
  assert.equal(Buffer.from(auth.slice("AUTH PLAIN ".length).trim(), "base64").toString(), "\0sender@example.test\0dummy");
  assert.ok(smtpCommands.includes("MAIL FROM:<info@itsbio.co.kr>\r\n"));
  assert.ok(smtpCommands.includes("RCPT TO:<recipient@example.test>\r\n"));
  assert.ok(smtpMessages[0].startsWith("From: ITSBio <info@itsbio.co.kr>\r\n"));
  assert.ok(smtpMessages[0].includes("Reply-To: visitor@example.test\r\n"));
});

test("configured representative sender applies to SMTP and fallback", async () => {
  for (const fallback of [false, true]) {
    const { handler, smtpMessages, fallbackMessages, smtpCommands } = createHandler(fallback, { MAILPLUG_FROM_EMAIL: "SUPPORT@example.test" });
    assert.equal((await handler(request(product))).status, 200);
    if (fallback) {
      assert.equal(fallbackMessages[0].from, "ITSBio <support@example.test>");
      assert.equal(fallbackMessages[0].replyTo, common.email);
    } else {
      assert.ok(smtpCommands.includes("MAIL FROM:<support@example.test>\r\n"));
      assert.ok(smtpMessages[0].startsWith("From: ITSBio <support@example.test>\r\n"));
    }
  }
});

test("fallback defaults to the representative info address", async () => {
  const { handler, fallbackMessages } = createHandler(true);
  assert.equal((await handler(request(product))).status, 200);
  assert.equal(fallbackMessages[0].from, "ITSBio <info@itsbio.co.kr>");
});

test("invalid sender configuration fails before any SMTP connection or fallback", async () => {
  const { handler, smtpCommands, fallbackMessages } = createHandler(false, { MAILPLUG_FROM_EMAIL: "not-an-email" });
  assert.equal((await handler(request(product))).status, 503);
  assert.equal(smtpCommands.length, 0);
  assert.equal(fallbackMessages.length, 0);
});

test("SMTP carries a spaced text version followed by the styled HTML version", async () => {
  const { handler, smtpMessages } = createHandler();
  assert.equal((await handler(request(product))).status, 200);
  const parts = smtpAlternatives(smtpMessages[0]);
  assert.deepEqual(parts.map(({ type }) => type), ["text/plain", "text/html"]);
  assert.match(parts[0].content, /Name: Test\n\nOrg: Example Lab/);
  assert.match(parts[0].content, /Message:\n\nPlease quote this product\./);
  assert.match(parts[1].content, /font-size:16px;line-height:1\.6/);
  assert.match(parts[1].content, /padding:0 0 12px/);
  assert.match(parts[1].content, /padding:24px/);
  for (const heading of ["Contact information", "Product information", "Message"]) {
    assert.ok(parts[1].content.includes(`>${heading}</h2>`));
  }
  for (const value of [product.name, product.org, product.email, product.phone, product.product, product.catNo, product.configuration, product.message]) {
    assert.ok(parts[1].content.includes(value), `Missing HTML value: ${value}`);
  }
});

test("fallback receives the same HTML and text information as SMTP", async () => {
  const smtp = createHandler();
  const fallback = createHandler(true);
  assert.equal((await smtp.handler(request(footer))).status, 200);
  assert.equal((await fallback.handler(request(footer))).status, 200);
  const parts = smtpAlternatives(smtp.smtpMessages[0]);
  assert.equal(parts[0].content, fallback.fallbackMessages[0].text);
  assert.equal(parts[1].content, fallback.fallbackMessages[0].html.replace(/\r\n/g, "\n"));
});

test("empty optional fields and empty product section are omitted", async () => {
  const { handler, smtpMessages } = createHandler();
  assert.equal((await handler(request({ email: common.email, message: common.message, privacyAccepted: true }))).status, 200);
  const parts = smtpAlternatives(smtpMessages[0]);
  for (const part of parts) {
    for (const label of ["Name:", "Org:", "Phone:", "Cat No:", "Quantity:", "Source page:", "Product information"]) {
      assert.ok(!part.content.includes(label), `Empty ${label} should be omitted`);
    }
    assert.ok(part.content.includes(common.email));
    assert.ok(part.content.includes(common.message));
  }
});

test("untrusted values are escaped and unsafe source URLs are not linked", async () => {
  const { handler, smtpMessages } = createHandler();
  assert.equal((await handler(request({ ...product, name: '<img src=x onerror="alert(1)">', product: "A&B <kit>", message: "<script>alert('x')</script>\n견적 부탁드립니다.", sourceUrl: "javascript:alert(1)" }))).status, 200);
  const [text, html] = smtpAlternatives(smtpMessages[0]).map(({ content }) => content);
  assert.ok(text.includes("A&B <kit>"));
  assert.ok(html.includes("A&amp;B &lt;kit&gt;"));
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.ok(html.includes("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;<br>견적 부탁드립니다."));
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img"));
  assert.ok(!html.includes('href="javascript:'));
});

test("Korean paragraphs and SMTP-looking text round-trip without altering delivery", async () => {
  const { handler, smtpMessages, smtpCommands } = createHandler();
  const message = "안녕하세요.\r\n\r\n납기와 견적 부탁드립니다.\r\n.\r\nRCPT TO:<other@example.test>";
  assert.equal((await handler(request({ ...product, name: "임호준", message }))).status, 200);
  const [text, html] = smtpAlternatives(smtpMessages[0]).map(({ content }) => content);
  assert.ok(text.includes("Name: 임호준"));
  assert.ok(text.includes(message.replace(/\r\n/g, "\n")));
  assert.ok(html.includes("안녕하세요.<br><br>납기와 견적 부탁드립니다.<br>.<br>RCPT TO:&lt;other@example.test&gt;"));
  assert.equal(smtpCommands.filter((command) => command.startsWith("RCPT TO:")).length, 1);
});

test("standard email parser accepts both alternatives with intact Korean content", async () => {
  const { handler, smtpMessages } = createHandler();
  assert.equal((await handler(request({ ...product, name: "임호준", message: "견적과 납기 안내 부탁드립니다.\n\n감사합니다." }))).status, 200);
  const parser = spawnSync("python", ["-c", `
import sys
from email import policy
from email.parser import BytesParser
message = BytesParser(policy=policy.default).parsebytes(sys.stdin.buffer.read())
assert not message.defects, message.defects
assert message.get_content_type() == 'multipart/alternative'
assert message['Reply-To'] == 'visitor@example.test'
parts = list(message.iter_parts())
assert [part.get_content_type() for part in parts] == ['text/plain', 'text/html']
for part in parts:
    assert not part.defects, part.defects
    assert part.get_content_charset() == 'utf-8'
    assert '임호준' in part.get_content()
    assert '견적과 납기 안내 부탁드립니다.' in part.get_content()
assert '\\r\\n\\r\\n감사합니다.' in parts[0].get_content()
assert '<br><br>감사합니다.' in parts[1].get_content()
`], { input: smtpMessages[0].replace(/\r\n\.\r\n$/, "\r\n"), encoding: "utf8" });
  assert.equal(parser.status, 0, parser.stderr || parser.error?.message);
});

