// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { freeRepostStillApplies, freeRepostVerdict, type FreeRepostJob } from "./free-repost.ts";

const now = new Date("2026-12-01T12:00:00Z");
const job = (over: Partial<FreeRepostJob> = {}): FreeRepostJob => ({ status: "expired", posted_at: "2026-08-01T12:00:00Z", filled_via: null, filled_application_id: null, is_seeded: false, free_repost_of: null, ...over });

test("a job that ran 3 months with no hire marked through Kestrel gets 1 free second chance", () => {
  assert.deepEqual(freeRepostVerdict(job(), false, now), { ok: true });
  assert.deepEqual(freeRepostVerdict(job({ status: "closed", filled_via: "indeed" }), false, now), { ok: true }, "filled somewhere else is not filled on Kestrel");
});

test("it is refused when the job is too new, still running, never went live, or a found listing", () => {
  assert.deepEqual(freeRepostVerdict(job({ posted_at: "2026-09-15T12:00:00Z" }), false, now), { ok: false, why: "too-soon" });
  assert.deepEqual(freeRepostVerdict(job({ status: "live" }), false, now), { ok: false, why: "still-running" });
  assert.deepEqual(freeRepostVerdict(job({ posted_at: null }), false, now), { ok: false, why: "never-live" });
  assert.deepEqual(freeRepostVerdict(job({ is_seeded: true }), false, now), { ok: false, why: "found-listing" });
});

test("it is refused when a hire was marked through Kestrel", () => {
  assert.deepEqual(freeRepostVerdict(job({ status: "closed", filled_via: "kestrel" }), false, now), { ok: false, why: "filled-on-kestrel" });
  assert.deepEqual(freeRepostVerdict(job({ status: "closed", filled_application_id: "abc" }), false, now), { ok: false, why: "filled-on-kestrel" });
});

test("it is once per job, and a free second chance does not give another", () => {
  assert.deepEqual(freeRepostVerdict(job(), true, now), { ok: false, why: "already-used" });
  assert.deepEqual(freeRepostVerdict(job({ free_repost_of: "older" }), false, now), { ok: false, why: "is-free-copy" });
});

test("it stays free only for the same role", () => {
  assert.equal(freeRepostStillApplies("Optician", "Optician"), true);
  assert.equal(freeRepostStillApplies("Optometrist", "Optician"), false);
  assert.equal(freeRepostStillApplies(null, null), false);
});
