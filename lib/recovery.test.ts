// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { RECOVERY_MINUTES, makeRecoveryValue, recoveryIsValid } from "./recovery.ts";

const SECRET = "test-secret";
const USER = "11111111-1111-4111-8111-111111111111";

test("a fresh recovery cookie works for the same person", () => {
  const now = Date.now();
  assert.equal(recoveryIsValid(SECRET, USER, makeRecoveryValue(SECRET, USER, now), now + 60_000), true);
});

test("it stops working after the time is up", () => {
  const now = Date.now();
  const cookie = makeRecoveryValue(SECRET, USER, now);
  assert.equal(recoveryIsValid(SECRET, USER, cookie, now + (RECOVERY_MINUTES + 1) * 60_000), false);
});

test("it does not work for someone else, with another key, or when changed", () => {
  const now = Date.now();
  const cookie = makeRecoveryValue(SECRET, USER, now);
  assert.equal(recoveryIsValid(SECRET, "22222222-2222-4222-8222-222222222222", cookie, now), false);
  assert.equal(recoveryIsValid("other-secret", USER, cookie, now), false);
  assert.equal(recoveryIsValid(SECRET, USER, cookie.replace(/\d(?=\.[0-9a-f]+$)/, "9"), now), false);
  assert.equal(recoveryIsValid(SECRET, USER, undefined, now), false);
  assert.equal(recoveryIsValid(SECRET, USER, "garbage", now), false);
  assert.equal(recoveryIsValid("", USER, cookie, now), false);
});
