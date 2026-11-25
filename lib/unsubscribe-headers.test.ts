// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { test } from "node:test";
import { oneClickUrl, unsubscribeHeaders } from "./unsubscribe-headers.ts";

// P1-51: emails with an unsubscribe link carry the one click form of the header (RFC 8058), pointing at a route that takes a POST.
const SITE = "https://eyecarejobs.ca";

test("an account or waitlist link becomes the one click address", () => {
  assert.equal(oneClickUrl(`${SITE}/unsubscribe/0b0c3c1e-1111-4222-8333-444455556666?s=abc123`, SITE), `${SITE}/api/unsubscribe?id=0b0c3c1e-1111-4222-8333-444455556666&s=abc123`);
});

test("an address link becomes the one click address", () => {
  assert.equal(oneClickUrl(`${SITE}/unsubscribe/address?e=YW5uQGNsaW5pYy5jYQ&s=def456`, SITE), `${SITE}/api/unsubscribe?e=YW5uQGNsaW5pYy5jYQ&s=def456`);
});

test("a link from anywhere else is not turned into a one click address", () => {
  assert.equal(oneClickUrl("https://elsewhere.example/unsubscribe/x?s=1", SITE), null);
});

test("the headers carry both lines, and fall back to the plain line for an unknown link", () => {
  assert.deepEqual(unsubscribeHeaders(`${SITE}/unsubscribe/address?e=YQ&s=1`, SITE), {
    "List-Unsubscribe": `<${SITE}/api/unsubscribe?e=YQ&s=1>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  });
  assert.deepEqual(unsubscribeHeaders("https://elsewhere.example/u", SITE), { "List-Unsubscribe": "<https://elsewhere.example/u>" });
});

test("deliverEmail uses these headers, and the route takes a POST", () => {
  assert.match(readFileSync(new URL("./email.ts", import.meta.url), "utf8"), /headers: unsubscribeHeaders\(unsubscribeUrl, SITE_URL\)/);
  const route = new URL("../app/api/unsubscribe/route.ts", import.meta.url);
  assert.ok(existsSync(route));
  const source = readFileSync(route, "utf8");
  assert.match(source, /export async function POST\(/);
  assert.match(source, /export async function GET\(/);
});
