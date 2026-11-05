// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_FAILURES, WINDOW_MS, afterFailure, attemptKey, currentFailures, needsCheck } from "./sign-in-limits.ts";

const now = Date.parse("2026-11-05T12:00:00Z");
const row = (failures: number, minutesAgo: number) => ({ failures, window_started_at: new Date(now - minutesAgo * 60000).toISOString() });

test("no row, or an old window, counts as no failures", () => {
  assert.equal(currentFailures(null, now), 0);
  assert.equal(currentFailures(row(9, 16), now), 0);
  assert.equal(currentFailures(row(3, 5), now), 3);
});

test("the bot check is asked for after 5 failures in the window, on either key", () => {
  assert.equal(needsCheck([row(MAX_FAILURES - 1, 1), null], now), false);
  assert.equal(needsCheck([row(MAX_FAILURES, 1), null], now), true);
  assert.equal(needsCheck([null, row(MAX_FAILURES, 1)], now), true);
  assert.equal(needsCheck([row(MAX_FAILURES, WINDOW_MS / 60000 + 1)], now), false);
});

test("a failure counts on in an open window and starts a new one after it has run out", () => {
  assert.deepEqual(afterFailure(row(2, 5), now), { failures: 3, window_started_at: row(2, 5).window_started_at });
  assert.deepEqual(afterFailure(row(4, 30), now), { failures: 1, window_started_at: new Date(now).toISOString() });
  assert.deepEqual(afterFailure(null, now), { failures: 1, window_started_at: new Date(now).toISOString() });
});

test("keys are scrambled, and the same address always gives the same key", () => {
  const key = attemptKey("email", " Person@Example.com ");
  assert.equal(key, attemptKey("email", "person@example.com"));
  assert.ok(!key.includes("person"));
  assert.notEqual(key, attemptKey("visitor", "person@example.com"));
});
