// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { filterJobs, newApplicantsHref, parseShow } from "./dashboard-filter.ts";

const jobs = [
  { id: "a", status: "live", posted_at: "2026-11-01" },
  { id: "b", status: "in_review", posted_at: null },
  { id: "c", status: "draft", posted_at: null },
  { id: "d", status: "rejected", posted_at: null },
  { id: "e", status: "expired", posted_at: "2026-09-01" },
];
const applicants = { a: { fresh: 2, total: 3 }, e: { fresh: 0, total: 1 } };

test("only the known filters are accepted", () => {
  assert.equal(parseShow("live"), "live");
  assert.equal(parseShow("everything"), null);
  assert.equal(parseShow(undefined), null);
});

test("each filter shows what its tile counts", () => {
  assert.deepEqual(filterJobs(jobs, "live", applicants).map((j) => j.id), ["a"]);
  assert.deepEqual(filterJobs(jobs, "review", applicants).map((j) => j.id), ["b"]);
  assert.deepEqual(filterJobs(jobs, "drafts", applicants).map((j) => j.id), ["c", "d"]);
  assert.deepEqual(filterJobs(jobs, "applicants", applicants).map((j) => j.id), ["a"]);
  assert.deepEqual(filterJobs(jobs, "posted", applicants).map((j) => j.id), ["a", "e"]);
  assert.equal(filterJobs(jobs, null, applicants).length, 5);
});

test("the New applicants tile goes straight to the one job with new applicants", () => {
  assert.equal(newApplicantsHref(jobs, applicants), "/clinic/jobs/a/applicants");
  assert.equal(newApplicantsHref(jobs, { a: { fresh: 1, total: 1 }, e: { fresh: 2, total: 2 } }), "/clinic?show=applicants#your-jobs");
  assert.equal(newApplicantsHref(jobs, {}), "/clinic?show=applicants#your-jobs");
});
