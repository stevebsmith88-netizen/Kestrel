// Run with: npm test
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { unsubscribeIdIsGenuine, unsubscribeIdUrl } from "./unsubscribe-link.ts";

const ID = "11111111-1111-4111-8111-111111111111";
afterEach(() => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

test("an account unsubscribe link carries a signature that checks out", () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-secret";
  const url = new URL(unsubscribeIdUrl(ID));
  assert.ok(url.pathname.endsWith(`/unsubscribe/${ID}`));
  assert.equal(unsubscribeIdIsGenuine(ID, url.searchParams.get("s") ?? ""), true);
});

test("a bare id, a wrong signature or another id is not enough", () => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-secret";
  const sig = new URL(unsubscribeIdUrl(ID)).searchParams.get("s") ?? "";
  assert.equal(unsubscribeIdIsGenuine(ID, undefined), false);
  assert.equal(unsubscribeIdIsGenuine(ID, "abc"), false);
  assert.equal(unsubscribeIdIsGenuine("22222222-2222-4222-8222-222222222222", sig), false);
});

test("with no key set, nothing counts as genuine", () => {
  assert.equal(unsubscribeIdIsGenuine(ID, "anything"), false);
});
