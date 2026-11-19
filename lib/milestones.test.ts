// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { ordinal, reachedKeys, toAnnounce, type MilestoneCounts } from "./milestones.ts";

const zero: MilestoneCounts = { waitlist: 0, clinics: 0, candidates: 0, liveJobs: 0, applications: 0, paidJobs: 0 };

test("ordinals", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 100, 101, 111].map(ordinal), ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "100th", "101st", "111th"]);
});

test("a milestone fires once, and only the highest new step is announced", () => {
  const counts = { ...zero, waitlist: 26, clinics: 1 };
  const first = toAnnounce(counts, []);
  assert.deepEqual(first.map((m) => m.key).sort(), ["clinics:1", "waitlist:25"]);
  assert.equal(first.find((m) => m.key === "waitlist:25")?.title, "Milestone: 25th waitlist sign up");
  assert.equal(first.find((m) => m.key === "clinics:1")?.channel, "signups");
  assert.deepEqual(toAnnounce(counts, reachedKeys(counts)), [], "nothing is repeated");
  assert.equal(toAnnounce({ ...counts, waitlist: 50 }, reachedKeys(counts))[0].key, "waitlist:50");
});

test("nothing is announced below the first step, and wording has no dashes", () => {
  assert.deepEqual(toAnnounce(zero, []), []);
  const all = toAnnounce({ waitlist: 5000, clinics: 500, candidates: 10000, liveJobs: 1000, applications: 10000, paidJobs: 500 }, []);
  for (const m of all) assert.doesNotMatch(`${m.title} ${m.line}`, /[–—]/);
  assert.match(all.find((m) => m.key === "liveJobs:1000")!.title, /1000 live jobs at the same time/);
});
