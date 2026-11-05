// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { canExtend, extendedUntil, parseFillSource } from "./job-ending.ts";

const NOW = new Date("2026-11-05T12:00:00Z");
const inDays = (d: number) => new Date(NOW.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

test("a live job can be extended in its last 7 days, not before", () => {
  assert.equal(canExtend({ status: "live", expires_at: inDays(3) }, NOW), true);
  assert.equal(canExtend({ status: "live", expires_at: inDays(7) }, NOW), true);
  assert.equal(canExtend({ status: "live", expires_at: inDays(20) }, NOW), false);
});

test("an expired job can come back for 7 days after it ended", () => {
  assert.equal(canExtend({ status: "expired", expires_at: inDays(-2) }, NOW), true);
  assert.equal(canExtend({ status: "expired", expires_at: inDays(-8) }, NOW), false);
});

test("closed, draft and found listings cannot be extended", () => {
  assert.equal(canExtend({ status: "closed", expires_at: inDays(2) }, NOW), false);
  assert.equal(canExtend({ status: "draft", expires_at: null }, NOW), false);
  assert.equal(canExtend({ status: "live", expires_at: inDays(2), is_seeded: true }, NOW), false);
});

test("extending adds 30 days to a live job's end date, or 30 from today for an expired one", () => {
  assert.equal(extendedUntil({ status: "live", expires_at: inDays(3) }, NOW).toISOString(), inDays(33));
  assert.equal(extendedUntil({ status: "expired", expires_at: inDays(-2) }, NOW).toISOString(), inDays(30));
});

test("the how did you fill it answer only accepts the listed choices", () => {
  assert.deepEqual(parseFillSource("indeed", "ignored"), { via: "indeed", other: null });
  assert.deepEqual(parseFillSource("other", "  A local  college "), { via: "other", other: "A local college" });
  assert.deepEqual(parseFillSource("monster", ""), { via: null, other: null });
});
