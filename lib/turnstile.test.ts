// Run with: npm test
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { passesTurnstile, turnstileEnforced } from "./turnstile.ts";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
  delete process.env.TURNSTILE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  delete process.env.VERCEL_ENV;
});

const reply = (body: unknown, ok = true) => (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;

test("with no keys, or only one key, the check does nothing and nobody is blocked", async () => {
  let called = false;
  globalThis.fetch = (async () => { called = true; return { ok: true, json: async () => ({ success: false }) }; }) as unknown as typeof fetch;
  assert.equal(turnstileEnforced(), false);
  assert.equal(await passesTurnstile(undefined), true);
  process.env.TURNSTILE_SECRET_KEY = "secret";
  assert.equal(turnstileEnforced(), false);
  assert.equal(await passesTurnstile(""), true);
  assert.equal(called, false);
});

test("with both keys, a missing or odd token fails without asking Cloudflare", async () => {
  process.env.TURNSTILE_SECRET_KEY = "secret";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
  let called = false;
  globalThis.fetch = (async () => { called = true; return { ok: true, json: async () => ({ success: true }) }; }) as unknown as typeof fetch;
  assert.equal(turnstileEnforced(), true);
  for (const bad of [undefined, null, "", 42, "x".repeat(3000)]) assert.equal(await passesTurnstile(bad), false);
  assert.equal(called, false);
});

test("a token Cloudflare accepts passes, and one it rejects does not", async () => {
  process.env.TURNSTILE_SECRET_KEY = "secret";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
  globalThis.fetch = reply({ success: true });
  assert.equal(await passesTurnstile("good-token"), true);
  globalThis.fetch = reply({ success: false, "error-codes": ["timeout-or-duplicate"] });
  assert.equal(await passesTurnstile("used-token"), false);
});

test("if Cloudflare cannot be reached, nobody gets through", async () => {
  process.env.TURNSTILE_SECRET_KEY = "secret";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site";
  globalThis.fetch = (async () => { throw new Error("network down"); }) as unknown as typeof fetch;
  assert.equal(await passesTurnstile("token"), false);
  globalThis.fetch = reply({}, false);
  assert.equal(await passesTurnstile("token"), false);
});

test("on the live site, missing keys mean the forms refuse instead of letting bots through", async () => {
  process.env.VERCEL_ENV = "production";
  assert.equal(await passesTurnstile("any token"), false);
  process.env.TURNSTILE_SECRET_KEY = "secret";
  assert.equal(await passesTurnstile("any token"), false);
});
