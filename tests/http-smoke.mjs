import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = 3107;
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    env: {
      ...process.env,
      WAITLIST_DEMO_MODE: "true",
      WAITLIST_WEBHOOK_URL: "",
      WAITLIST_WEBHOOK_TOKEN: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let log = "";
server.stdout.on("data", (data) => {
  log += data;
});
server.stderr.on("data", (data) => {
  log += data;
});
try {
  let page;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      page = await fetch(`http://127.0.0.1:${port}`, {
        signal: AbortSignal.timeout(1500),
      });
      if (page.ok) break;
    } catch {
      /* starting */
    }
    if (server.exitCode !== null) throw new Error(log);
    await delay(100);
  }
  assert.ok(page?.ok, `Server did not start: ${log}`);
  const html = await page.text();
  assert.ok(html.includes("Your email address"));
  assert.ok(html.includes("data-envelope"));
  assert.ok(
    !html.includes("Preview mode. Try"),
    "production ignores preview flag",
  );
  const response = await fetch(`http://127.0.0.1:${port}/api/waitlist`, {
    signal: AbortSignal.timeout(5000),
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "qa@example.com" }),
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  console.log(
    "PASS: production renders the form and envelope; unconfigured signup returns 503 even with the preview flag.",
  );
} finally {
  server.kill("SIGTERM");
}
