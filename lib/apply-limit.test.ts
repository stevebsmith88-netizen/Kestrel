// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { APPLY_LIMIT_TEXT, MAX_APPLICATIONS_PER_DAY, applyWindowStart, overApplyLimit } from "./apply-limit.ts";

const NOW = new Date("2026-11-12T15:00:00Z");
const hoursAgo = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString();
const sent = (count: number, hours: number) => Array.from({ length: count }, () => hoursAgo(hours));

test("the limit is 30 applications in 24 hours", () => {
  assert.equal(MAX_APPLICATIONS_PER_DAY, 30);
  assert.equal(applyWindowStart(NOW).toISOString(), "2026-11-11T15:00:00.000Z");
});

test("someone with no applications, or a few, can apply", () => {
  assert.equal(overApplyLimit([], NOW), false);
  assert.equal(overApplyLimit(sent(5, 2), NOW), false);
});

test("the 30th application of the day goes through and the 31st is refused", () => {
  assert.equal(overApplyLimit(sent(29, 1), NOW), false);
  assert.equal(overApplyLimit(sent(30, 1), NOW), true);
  assert.equal(overApplyLimit(sent(45, 1), NOW), true);
});

test("applications sent more than 24 hours ago do not count", () => {
  assert.equal(overApplyLimit([...sent(30, 25), ...sent(10, 3)], NOW), false);
  assert.equal(overApplyLimit([...sent(29, 23.9), hoursAgo(24.1)], NOW), false);
  assert.equal(overApplyLimit([...sent(29, 23.9), hoursAgo(23.99)], NOW), true);
  // Exactly 24 hours ago has just dropped out.
  assert.equal(overApplyLimit(sent(30, 24), NOW), false);
});

test("dates that cannot be read are ignored, so a strange row never locks anyone out", () => {
  assert.equal(overApplyLimit([...sent(29, 1), "not a date", ""], NOW), false);
});

test("the message is kind and says when they can apply again", () => {
  assert.match(APPLY_LIMIT_TEXT, /today's limit of 30 applications/);
  assert.match(APPLY_LIMIT_TEXT, /apply again tomorrow/);
});
