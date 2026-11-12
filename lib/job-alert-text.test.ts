// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { alertLine, ALERT_PAY_COLUMNS } from "./job-alert-text.ts";

const base = { title: "Optician", clinic: "Harbourside Optical", place: "Victoria, British Columbia" };

test("an alert line carries the pay (P1-26)", () => {
  assert.equal(alertLine({ ...base, pay_period: "year", pay_min: 62000, pay_max: 74000 }), "Optician, Harbourside Optical, Victoria, British Columbia, $62,000 to $74,000 a year");
  assert.match(alertLine({ ...base, pay_period: "day", pay_min: 600, pay_max: 800, pay_is_minimum: true, pay_percent_min: 28, pay_percent_max: 35, pay_percent_of: "collections" }), /Minimum \$600 to \$800 a day and 28% to 35% of collections$/);
  assert.match(alertLine({ ...base, pay_percent_min: 28, pay_percent_max: 35 }), /28% to 35% of production$/);
});

test("a job with no pay columns says so rather than leaving it out", () => {
  assert.match(alertLine(base), /Pay not stated$/);
});

test("the alert query asks for every pay column the pay text reads", () => {
  for (const c of ["pay_period", "pay_min", "pay_max", "pay_is_minimum", "pay_percent_min", "pay_percent_max", "pay_percent_of"]) assert.ok(ALERT_PAY_COLUMNS.includes(c), c);
});
