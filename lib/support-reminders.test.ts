// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { businessDaysSince, overdue, reminderLines } from "./support-reminders.ts";

test("business days skip weekends, by Toronto time", () => {
  const monday = new Date("2026-11-16T15:00:00Z");
  assert.equal(businessDaysSince(monday, new Date("2026-11-16T22:00:00Z")), 0, "the same day");
  assert.equal(businessDaysSince(monday, new Date("2026-11-17T15:00:00Z")), 1, "Tuesday");
  assert.equal(businessDaysSince(monday, new Date("2026-11-20T15:00:00Z")), 4, "Friday");
  assert.equal(businessDaysSince(new Date("2026-11-20T20:00:00Z"), new Date("2026-11-22T15:00:00Z")), 0, "Friday to Sunday");
  assert.equal(businessDaysSince(new Date("2026-11-20T20:00:00Z"), new Date("2026-11-23T15:00:00Z")), 1, "Friday to Monday");
});

test("a request is overdue once 1 business day has passed", () => {
  assert.equal(overdue("2026-11-16T15:00:00Z", new Date("2026-11-16T23:00:00Z")), false);
  assert.equal(overdue("2026-11-16T15:00:00Z", new Date("2026-11-17T15:00:00Z")), true);
  assert.equal(overdue("2026-11-20T20:00:00Z", new Date("2026-11-21T15:00:00Z")), false, "the weekend does not count");
});

test("the reminder says only what is waiting", () => {
  assert.deepEqual(reminderLines(0, 0), []);
  assert.deepEqual(reminderLines(1, 0), ["1 support request has waited more than 1 business day"]);
  assert.equal(reminderLines(2, 3).length, 2);
  assert.match(reminderLines(0, 1)[0], /within 2/);
});
