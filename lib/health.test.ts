// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { REQUIRED_IN_PRODUCTION, dailyStatus, missingSettings } from "./health.ts";

test("missing settings are listed by name", () => {
  assert.deepEqual(missingSettings({}), REQUIRED_IN_PRODUCTION);
  const all = Object.fromEntries(REQUIRED_IN_PRODUCTION.map((n) => [n, "x"]));
  assert.deepEqual(missingSettings(all), []);
  assert.deepEqual(missingSettings({ ...all, CRON_SECRET: "" }), ["CRON_SECRET"]);
});

test("the daily job is late after 36 hours without a good run", () => {
  const now = new Date("2026-11-10T14:00:00Z");
  assert.equal(dailyStatus("2026-11-10T13:55:00Z", now), "ok");
  assert.equal(dailyStatus("2026-11-09T02:00:00Z", now), "ok"); // 36 hours exactly is not yet late
  assert.equal(dailyStatus("2026-11-09T01:59:00Z", now), "late");
  assert.equal(dailyStatus(null, now), "none");
});
