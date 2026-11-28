// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { closesText, daysLeft, openness, sortSaved } from "./saved-jobs.ts";

const now = new Date("2026-11-19T12:00:00Z");

test("a live job that has not ended is open, anything else says why not", () => {
  assert.equal(openness({ status: "live", expires_at: "2026-12-01T00:00:00Z" }, now).open, true);
  assert.match(openness({ status: "closed", expires_at: "2026-12-01T00:00:00Z" }, now).text, /filled or closed/);
  assert.match(openness({ status: "live", expires_at: "2026-11-01T00:00:00Z" }, now).text, /has ended/);
  assert.match(openness({ status: "expired", expires_at: null }, now).text, /has ended/);
  assert.match(openness(null, now).text, /removed/);
  assert.equal(openness({ status: "draft", expires_at: null }, now).open, false);
});

test("open jobs come first, closing soonest first, then ended ones, newest saved first", () => {
  const rows = [
    { id: "a", open: false, expires_at: "2026-11-01T00:00:00Z", saved_at: "2026-10-01T00:00:00Z" },
    { id: "b", open: true, expires_at: "2026-12-20T00:00:00Z", saved_at: "2026-11-01T00:00:00Z" },
    { id: "c", open: true, expires_at: "2026-11-25T00:00:00Z", saved_at: "2026-11-02T00:00:00Z" },
    { id: "d", open: false, expires_at: "2026-11-10T00:00:00Z", saved_at: "2026-10-15T00:00:00Z" },
  ];
  assert.deepEqual(sortSaved(rows).map((r) => r.id), ["c", "b", "d", "a"]);
});

test("the closing line only appears in the last week", () => {
  assert.equal(daysLeft("2026-11-20T00:00:00Z", now), 1);
  assert.equal(closesText(1), "Closes today or tomorrow");
  assert.equal(closesText(5), "Closes in 5 days");
  assert.equal(closesText(12), "");
  assert.equal(daysLeft(null, now), null);
});
