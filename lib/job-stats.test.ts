// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { isBotAgent, numbersLine, parseEvent, summariseStats, sumNumbers } from "./job-stats.ts";

const ID = "3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b";

test("only a job id and a known kind are accepted from the browser", () => {
  assert.deepEqual(parseEvent({ job: ID, kind: "view" }), { jobId: ID, kind: "view" });
  assert.deepEqual(parseEvent({ job: ID.toUpperCase(), kind: "apply_click" }), { jobId: ID, kind: "apply_click" });
  assert.equal(parseEvent({ job: "not-an-id", kind: "view" }), null);
  assert.equal(parseEvent({ job: ID, kind: "delete" }), null);
  assert.equal(parseEvent(null), null);
  assert.equal(parseEvent("view"), null);
});

test("crawlers and link previews are not counted, and a missing agent is not a person", () => {
  assert.equal(isBotAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), true);
  assert.equal(isBotAgent("WhatsApp/2.23"), true);
  assert.equal(isBotAgent(null), true);
  assert.equal(isBotAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1"), false);
});

test("the last 30 days include today and the 29 before it", () => {
  const today = new Date("2026-11-30T15:00:00Z");
  const rows = [
    { job_id: "a", day: "2026-11-30", views: 4, apply_clicks: 1 },
    { job_id: "a", day: "2026-11-01", views: 6, apply_clicks: 0 },
    { job_id: "a", day: "2026-10-31", views: 10, apply_clicks: 2 },
    { job_id: "b", day: "2026-11-15", views: 3, apply_clicks: 3 },
  ];
  const out = summariseStats(rows, today);
  assert.deepEqual(out.a, { views30: 10, clicks30: 1, viewsTotal: 20, clicksTotal: 3 });
  assert.deepEqual(out.b, { views30: 3, clicks30: 3, viewsTotal: 3, clicksTotal: 3 });
  assert.deepEqual(sumNumbers(out), { views30: 13, clicks30: 4, viewsTotal: 23, clicksTotal: 6 });
});

test("the dashboard line says so plainly when nothing is counted, and gets singular and plural right", () => {
  assert.equal(numbersLine(undefined), "No views yet");
  assert.equal(numbersLine({ views30: 1, clicks30: 1, viewsTotal: 1, clicksTotal: 1 }), "1 view · 1 apply click");
  assert.equal(numbersLine({ views30: 0, clicks30: 0, viewsTotal: 1234, clicksTotal: 12 }), "1,234 views · 12 apply clicks");
});
