// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { filtersInUse, jobsHref, pageRange, parseJobsQuery, searchTerm } from "./admin-jobs-filter.ts";

test("a search is cleaned of characters that mean something to the database filter", () => {
  assert.equal(searchTerm("  Riverside, (Family) %Eye*  "), "Riverside Family Eye");
  assert.equal(searchTerm(undefined), "");
  assert.equal(searchTerm("x".repeat(100)).length, 60);
});

test("the address is read safely, with sensible defaults", () => {
  assert.deepEqual(parseJobsQuery({}), { q: "", status: "all", order: "newest", page: 1 });
  assert.deepEqual(parseJobsQuery({ q: "guelph", status: "live", order: "oldest", page: "3" }), { q: "guelph", status: "live", order: "oldest", page: 3 });
  assert.equal(parseJobsQuery({ status: "draft" }).status, "all", "drafts are never listed");
  assert.equal(parseJobsQuery({ status: "nonsense" }).status, "all");
  assert.equal(parseJobsQuery({ page: "-4" }).page, 1);
  assert.equal(parseJobsQuery({ page: "abc" }).page, 1);
  assert.equal(parseJobsQuery({ order: "sideways" }).order, "newest");
});

test("pages of 25 are counted from the first row", () => {
  assert.deepEqual(pageRange(1), { from: 0, to: 24 });
  assert.deepEqual(pageRange(3), { from: 50, to: 74 });
});

test("Previous and Next keep the search", () => {
  assert.equal(jobsHref(parseJobsQuery({}), 1), "/admin/jobs");
  assert.equal(jobsHref(parseJobsQuery({ q: "guelph", status: "live", order: "oldest" }), 2), "/admin/jobs?q=guelph&status=live&order=oldest&page=2");
  assert.equal(filtersInUse(parseJobsQuery({})), false);
  assert.equal(filtersInUse(parseJobsQuery({ status: "live" })), true);
});
