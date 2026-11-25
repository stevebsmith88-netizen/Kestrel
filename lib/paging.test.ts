// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPage, lastPage, pageOrLast, type PageFetch } from "./paging.ts";

test("page numbers are held between 1 and the last page", () => {
  assert.equal(lastPage(0, 20), 1);
  assert.equal(lastPage(41, 20), 3);
  assert.equal(clampPage(400, 41, 20), 3);
  assert.equal(clampPage(0, 41, 20), 1);
  assert.equal(clampPage(2, 41, 20), 2);
});

// A stand in for the database: 41 jobs, 20 a page, and a range past the end is refused, as the real database does.
const rows = Array.from({ length: 41 }, (_, i) => i + 1);
const fetchPage = async (p: number): Promise<PageFetch<number>> => (p > 3 ? { rows: [], count: null, error: true } : { rows: rows.slice((p - 1) * 20, p * 20), count: 41, error: false });
const countAll = async () => 41;

test("/jobs?page=400 shows the last page, with its jobs (P1-50)", async () => {
  const r = await pageOrLast(400, 20, fetchPage, countAll);
  assert.equal(r.page, 3);
  assert.equal(r.total, 41);
  assert.deepEqual(r.rows, [41]);
});

test("a page past the end that comes back empty rather than as an error is also moved back", async () => {
  const empty = async (p: number): Promise<PageFetch<number>> => (p > 3 ? { rows: [], count: 41, error: false } : fetchPage(p));
  const r = await pageOrLast(7, 20, empty, countAll);
  assert.equal(r.page, 3);
  assert.deepEqual(r.rows, [41]);
});

test("pages in range, and a search with no results, are left alone", async () => {
  assert.equal((await pageOrLast(2, 20, fetchPage, countAll)).page, 2);
  const none = async (): Promise<PageFetch<number>> => ({ rows: [], count: 0, error: false });
  const r = await pageOrLast(5, 20, none, async () => 0);
  assert.deepEqual({ page: r.page, total: r.total, rows: r.rows }, { page: 1, total: 0, rows: [] });
});
