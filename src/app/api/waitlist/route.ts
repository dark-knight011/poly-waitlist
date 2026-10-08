import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { normalizeEmail } from "../../../lib/waitlist";

export const runtime = "nodejs";

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 4096) {
        await reader.cancel();
        throw new Error("large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function POST(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return NextResponse.json(
      { ok: false, message: "Please submit the signup form." },
      { status: 415 },
    );
  }
  let body;
  try {
    body = await readBody(request);
  } catch {
    return NextResponse.json(
      { ok: false, message: "Please submit a valid email address." },
      { status: 400 },
    );
  }
  const email = normalizeEmail(body?.email);
  if (!email)
    return NextResponse.json(
      { ok: false, message: "Enter a valid email address." },
      { status: 400 },
    );

  // Explicit, visibly labeled local preview. Never accepts fake signups in production.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.WAITLIST_DEMO_MODE === "true"
  ) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const endpoint = process.env.WAITLIST_WEBHOOK_URL;
  const token = process.env.WAITLIST_WEBHOOK_TOKEN;
  if (!endpoint || !token) {
    return NextResponse.json(
      {
        ok: false,
        message: "The waitlist isn’t open yet. Please check back soon.",
      },
      { status: 503 },
    );
  }
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password)
      throw new Error("invalid configuration");
    const result = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": createHash("sha256")
          .update(`waitlist:${email}`)
          .digest("hex"),
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    const receipt = await result.json().catch(() => null);
    // The receiver must acknowledge only AFTER durable storage, including duplicates.
    if (!result.ok || receipt?.ok !== true) throw new Error("not acknowledged");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "We couldn’t confirm your place. Please try again.",
      },
      { status: 502 },
    );
  }
}
