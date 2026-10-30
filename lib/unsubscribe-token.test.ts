// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { addressFromUnsubscribe, normaliseAddress, signValue, suppressionKeys, unsubscribeQuery, valueIsGenuine } from "./unsubscribe-token.ts";

const secret = "test-secret";

test("addresses are matched whatever their capitals or spaces", () => {
  assert.equal(normaliseAddress("  Hiring@Clinic.CA "), "hiring@clinic.ca");
  assert.deepEqual(suppressionKeys("Hiring@Clinic.CA"), ["hiring@clinic.ca", "@clinic.ca"]);
});

test("a genuine unsubscribe link gives back the address", () => {
  const q = new URLSearchParams(unsubscribeQuery(secret, "Hiring@Clinic.ca"));
  assert.equal(addressFromUnsubscribe(secret, q.get("e") ?? "", q.get("s") ?? ""), "hiring@clinic.ca");
});

test("a changed address, a wrong signature or a different secret is refused", () => {
  const q = new URLSearchParams(unsubscribeQuery(secret, "hiring@clinic.ca"));
  const other = Buffer.from("someone@else.ca").toString("base64url");
  assert.equal(addressFromUnsubscribe(secret, other, q.get("s") ?? ""), null);
  assert.equal(addressFromUnsubscribe(secret, q.get("e") ?? "", "0".repeat(64)), null);
  assert.equal(addressFromUnsubscribe("another-secret", q.get("e") ?? "", q.get("s") ?? ""), null);
  assert.equal(addressFromUnsubscribe(secret, undefined, undefined), null);
  assert.equal(addressFromUnsubscribe(secret, q.get("e") ?? "", "short"), null);
});

test("a signed value only works for its own purpose and its own value", () => {
  const sig = signValue(secret, "waitlist-confirm", "abc");
  assert.equal(valueIsGenuine(secret, "waitlist-confirm", "abc", sig), true);
  assert.equal(valueIsGenuine(secret, "unsubscribe", "abc", sig), false);
  assert.equal(valueIsGenuine(secret, "waitlist-confirm", "abd", sig), false);
  assert.equal(valueIsGenuine("other", "waitlist-confirm", "abc", sig), false);
  assert.equal(valueIsGenuine(secret, "waitlist-confirm", undefined, sig), false);
  assert.equal(valueIsGenuine(secret, "waitlist-confirm", "abc", "short"), false);
});
