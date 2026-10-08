import assert from "node:assert/strict";
import { afterEach, test, mock } from "node:test";
import { POST } from "../src/app/api/waitlist/route";
import { normalizeEmail } from "../src/lib/waitlist";

const original = {
  mode: process.env.NODE_ENV,
  demo: process.env.WAITLIST_DEMO_MODE,
  url: process.env.WAITLIST_WEBHOOK_URL,
  token: process.env.WAITLIST_WEBHOOK_TOKEN,
};
afterEach(() => {
  mock.restoreAll();
  for (const [key, value] of Object.entries({
    NODE_ENV: original.mode,
    WAITLIST_DEMO_MODE: original.demo,
    WAITLIST_WEBHOOK_URL: original.url,
    WAITLIST_WEBHOOK_TOKEN: original.token,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
const request = (email: unknown) =>
  new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
function production(configured = false) {
  Object.assign(process.env, {
    NODE_ENV: "production",
    WAITLIST_DEMO_MODE: "false",
  });
  delete process.env.WAITLIST_WEBHOOK_URL;
  delete process.env.WAITLIST_WEBHOOK_TOKEN;
  if (configured)
    Object.assign(process.env, {
      WAITLIST_WEBHOOK_URL: "https://example.com/waitlist",
      WAITLIST_WEBHOOK_TOKEN: "test-only-token",
    });
}

test("shared validation normalizes and rejects bad or oversized input", () => {
  assert.equal(normalizeEmail("  HELLO@Example.com "), "hello@example.com");
  for (const value of [
    null,
    123,
    "",
    "a@b",
    "hello there@example.com",
    "x".repeat(255) + "@example.com",
  ])
    assert.equal(normalizeEmail(value), null);
});
test("invalid input never reaches the provider", async () => {
  production(true);
  const fetch = mock.method(globalThis, "fetch", async () => {
    throw new Error("must not send");
  });
  assert.equal((await POST(request("invalid"))).status, 400);
  assert.equal(fetch.mock.callCount(), 0);
});
test("unconfigured production rejects fake success even if preview flag is set", async () => {
  production();
  process.env.WAITLIST_DEMO_MODE = "true";
  const response = await POST(request("hello@example.com"));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
});
test("explicit local preview labels its response and does not transmit", async () => {
  Object.assign(process.env, {
    NODE_ENV: "development",
    WAITLIST_DEMO_MODE: "true",
  });
  const fetch = mock.method(globalThis, "fetch", async () => {
    throw new Error("must not send");
  });
  const response = await POST(request("hello@example.com"));
  assert.deepEqual(await response.json(), { ok: true, demo: true });
  assert.equal(fetch.mock.callCount(), 0);
});
test("success awaits a durable acknowledgement and retries carry a stable key", async () => {
  production(true);
  const calls: RequestInit[] = [];
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    calls.push(init);
    await gate;
    return Response.json({ ok: true });
  });
  let complete = false;
  const pending = POST(request("HELLO@example.com")).then((response) => {
    complete = true;
    return response;
  });
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(complete, false, "response waits for the provider");
  release?.();
  assert.equal((await pending).status, 200);
  assert.equal((await POST(request(" hello@example.com "))).status, 200);
  assert.equal(calls[0].body, JSON.stringify({ email: "hello@example.com" }));
  assert.equal(
    new Headers(calls[0].headers).get("Idempotency-Key"),
    new Headers(calls[1].headers).get("Idempotency-Key"),
  );
  assert.equal(calls[0].redirect, "error");
});
test("provider rejection, malformed receipt and timeout never report success", async () => {
  production(true);
  const fetch = mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: false }),
  );
  assert.equal((await POST(request("hello@example.com"))).status, 502);
  fetch.mock.mockImplementation(
    async () => new Response("invalid", { status: 200 }),
  );
  assert.equal((await POST(request("hello@example.com"))).status, 502);
  fetch.mock.mockImplementation(async () => {
    throw new DOMException("timeout", "TimeoutError");
  });
  assert.equal((await POST(request("hello@example.com"))).status, 502);
});
test("non-HTTPS configuration fails without transmitting", async () => {
  production(true);
  process.env.WAITLIST_WEBHOOK_URL = "http://example.com/waitlist";
  const fetch = mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true }),
  );
  assert.equal((await POST(request("hello@example.com"))).status, 502);
  assert.equal(fetch.mock.callCount(), 0);
});
test("body and content-type limits reject invalid requests", async () => {
  production();
  assert.equal(
    (
      await POST(
        new Request("http://localhost/api/waitlist", {
          method: "POST",
          body: "{}",
        }),
      )
    ).status,
    415,
  );
  const response = await POST(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "x".repeat(4097),
    }),
  );
  assert.equal(response.status, 400);
});
