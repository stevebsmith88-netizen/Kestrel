// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ALERTS_PAUSED_NOTE, alertsPaused } from "./alerts-paused.ts";

// P1-51 (second half): unsubscribing from Kestrel's emails also stops job alert emails (app/api/cron/daily/route.ts skips anyone with
// unsubscribed_at). The alerts page says so, with a way to turn emails back on.

test("the note shows only for a person who has unsubscribed", () => {
  assert.equal(alertsPaused({ unsubscribed_at: "2026-11-10T09:00:00Z" }), true);
  assert.equal(alertsPaused({ unsubscribed_at: null }), false);
  assert.equal(alertsPaused(null), false);
});

test("the note says the alerts are kept but not emailed", () => {
  assert.match(ALERTS_PAUSED_NOTE, /unsubscribed/);
  assert.match(ALERTS_PAUSED_NOTE, /not emailing/);
  assert.match(ALERTS_PAUSED_NOTE, /kept/);
});

test("the daily job still skips people who unsubscribed, which is what the note describes", () => {
  assert.match(readFileSync(new URL("../app/api/cron/daily/route.ts", import.meta.url), "utf8"), /if \(!profile \|\| profile\.unsubscribed_at\) continue;/);
});

test("the alerts page shows the note and links to Email choices", () => {
  const page = readFileSync(new URL("../app/candidate/alerts/page.tsx", import.meta.url), "utf8");
  assert.match(page, /alertsPaused\(/);
  assert.match(page, /\{ALERTS_PAUSED_NOTE\}/);
  assert.match(page, /href="\/account#ac-email-prefs"/);
});
