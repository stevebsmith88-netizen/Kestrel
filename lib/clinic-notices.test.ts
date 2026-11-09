// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { jobNotices } from "./clinic-notices.ts";

const now = new Date("2026-11-10T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
const job = (over: Record<string, unknown>) => ({ id: "a", title: "Optician", status: "live", posted_at: ago(1), expires_at: ago(-29), review_note: null, ...over }) as Parameters<typeof jobNotices>[0][number];

test("a job approved in the last 7 days gets a message", () => {
  const n = jobNotices([job({})], now);
  assert.equal(n.length, 1);
  assert.equal(n[0].kind, "approved");
  assert.equal(n[0].text, "Optician has been approved and is now live. Candidates can see it and apply.");
});

test("older, expired, unfinished and in review jobs get no approval message", () => {
  assert.deepEqual(jobNotices([job({ posted_at: ago(8) }), job({ id: "b", expires_at: ago(1) }), job({ id: "c", status: "in_review" }), job({ id: "d", status: "draft", posted_at: null })], now), []);
  assert.deepEqual(jobNotices([job({ posted_at: ago(-1) })], now), [], "a date in the future is ignored");
});

test("a job sent back with a note shows what to change, ahead of approvals, and a note-less one shows nothing", () => {
  const n = jobNotices([job({ id: "ok" }), job({ id: "back", title: "Optometrist", status: "rejected", posted_at: null, expires_at: null, review_note: "Please add the pay range." }), job({ id: "none", status: "rejected", review_note: null })], now);
  assert.deepEqual(n.map((x) => x.id), ["back", "ok"]);
  assert.equal(n[0].text, "Optometrist needs a change before it can go live: Please add the pay range.");
});

test("newest approval comes first", () => {
  assert.deepEqual(jobNotices([job({ id: "old", posted_at: ago(5) }), job({ id: "new", posted_at: ago(1) })], now).map((x) => x.id), ["new", "old"]);
});
