// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { RETENTION_DAYS, retentionCutoffs } from "./retention.ts";

test("the retention periods are the ones Steve chose and the privacy policy states", () => {
  assert.equal(RETENTION_DAYS.unconfirmedWaitlist, 30);
  assert.equal(RETENTION_DAYS.inboxMessages, 365);
  assert.equal(RETENTION_DAYS.reportsAndClaims, 730);
  const privacy = readFileSync("app/privacy/page.tsx", "utf8");
  for (const words of ["30 days", "12 months", "2 years"]) assert.ok(privacy.includes(words), `the privacy policy should mention ${words}`);
});

test("cutoffs count back from now", () => {
  const c = retentionCutoffs(new Date("2027-12-31T12:00:00Z"));
  assert.equal(c.unconfirmedWaitlist, "2027-12-01T12:00:00.000Z");
  assert.equal(c.inboxMessages, "2026-12-31T12:00:00.000Z");
  assert.equal(c.reportsAndClaims, "2025-12-31T12:00:00.000Z");
});

test("the daily job deletes on these periods", () => {
  const cron = readFileSync("app/api/cron/daily/route.ts", "utf8");
  assert.match(cron, /retentionCutoffs\(/);
  for (const table of ["waitlist", "notifications", "job_reports", "listing_claims"]) assert.ok(cron.includes(`from("${table}").delete()`), `the daily job should clear old ${table}`);
});
