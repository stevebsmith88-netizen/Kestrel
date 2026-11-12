// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { findPlace } from "./places.ts";
import { orderJobs, parseSort, sortChoice } from "./job-sort.ts";

const toronto = findPlace("Toronto", "Ontario");
const jobs = [
  { id: "far", posted_at: "2026-11-10", city: "Ottawa", province: "Ontario" },
  { id: "field", posted_at: "2026-11-12", city: "Toronto", province: "Ontario", work_arrangement: "field" },
  { id: "near", posted_at: "2026-11-01", city: "Toronto", province: "Ontario" },
  { id: "mid", posted_at: "2026-11-11", city: "Hamilton", province: "Ontario" },
];

test("only known sorts are accepted", () => {
  assert.equal(parseSort("near"), "near");
  assert.equal(parseSort("oldest"), null);
  assert.equal(parseSort(undefined), null);
});

test("best match is offered only to a candidate with a role, and closest only with a place", () => {
  assert.deepEqual(sortChoice(null, { forMe: false, hasPlace: false }), { options: ["new"], sort: "new" });
  assert.deepEqual(sortChoice(null, { forMe: true, hasPlace: true }), { options: ["best", "new", "near"], sort: "best" });
  assert.equal(sortChoice("best", { forMe: false, hasPlace: false }).sort, "new");
  assert.equal(sortChoice("near", { forMe: true, hasPlace: false }).sort, "best");
  assert.equal(sortChoice("near", { forMe: false, hasPlace: true }).sort, "near");
});

test("newest puts the latest first, and closest puts the nearest first with field based and unknown places last", () => {
  assert.deepEqual(orderJobs(jobs, "new", toronto).map((j) => j.id), ["field", "mid", "far", "near"]);
  assert.deepEqual(orderJobs(jobs, "near", toronto).map((j) => j.id), ["near", "mid", "far", "field"]);
  assert.deepEqual(orderJobs(jobs, "near", null).map((j) => j.id), ["field", "mid", "far", "near"]);
});
