// Exercise the real API handler with both mail transports replaced in memory.
// No credentials are read and no network connections or emails are made.
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { test } from "node:test";

const source = stripTypeScriptTypes(readFileSync(new URL("../app/api/quote/route.ts", import.meta.url), "utf8"))
  .replace('import tls from "node:tls";', "const tls = dependencies.tls;")
  .replace('import { Resend } from "resend";', "const Resend = dependencies.Resend;")
  .replace(/^export /gm, "");

function createHandler(fallback = false) {
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
    { env: { MAILPLUG_SMTP_USER: "sender@example.test", MAILPLUG_SMTP_PASSWORD: "dummy", QUOTE_TO_EMAIL: "recipient@example.test", RESEND_API_KEY: "dummy" } },
    { error() {} },
  );
  return { handler, smtpMessages, fallbackMessages };
}

const common = { name: "Test", org: "Example Lab", email: "visitor@example.test", phone: "010-0000-0000", message: "Please quote this product.", privacyAccepted: true, sourceUrl: "https://itsbio.co.kr/products/example" };
const product = { ...common, product: "Example instrument", catNo: "EX-001", configuration: "Selected model", quantity: "3" };
const footer = { ...common, field: "Life Science", department: "Research", inquiryType: "Product inquiry" };
const request = (body) => new Request("https://itsbio.co.kr/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

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
      const text = fallback ? fallbackMessages[0].text : smtpMessages[0].replace(/\r\n/g, "\n");
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
  assert.ok(!smtpMessages[0].includes("Quantity:"));
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
  assert.ok(smtpMessages[0].includes("Department: Research Injected: value\r\n"));
});

test("privacy agreement remains required", async () => {
  const { handler, smtpMessages } = createHandler();
  assert.equal((await handler(request({ ...product, privacyAccepted: false }))).status, 400);
  assert.equal(smtpMessages.length, 0);
});
