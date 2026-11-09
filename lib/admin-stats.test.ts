// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { change, countIn, gateC, hiresSummary, investorNumbers, parsePeriod, percent, periodRange, ratio, repeatWithin, topCounts, weeklyCounts } from "./admin-stats.ts";

const now = new Date("2026-10-30T12:00:00Z");

test("periods", () => {
  assert.equal(parsePeriod("90"), "90");
  assert.equal(parsePeriod("year"), "year");
  assert.equal(parsePeriod("whatever"), "30");
  assert.equal(parsePeriod(undefined), "30");
  const r = periodRange("30", now);
  assert.equal(Math.round((r.end.getTime() - r.start.getTime()) / 86400000), 30);
  assert.equal(r.previousEnd.getTime(), r.start.getTime());
  assert.equal(periodRange("year", now).start.toISOString(), "2026-01-01T00:00:00.000Z");
});

test("counting by date and by week", () => {
  const dates = ["2026-10-29T10:00:00Z", "2026-10-20T10:00:00Z", "2026-08-01T10:00:00Z", null, undefined];
  const r = periodRange("30", now);
  assert.equal(countIn(dates, r.start, r.end), 2);
  const weeks = weeklyCounts(dates, 12, now);
  assert.equal(weeks.length, 12);
  assert.equal(weeks[11].count, 1);
  assert.equal(weeks.reduce((s, w) => s + w.count, 0), 2);
});

test("top counts gather the rest into Other", () => {
  const out = topCounts(["Ontario", "Ontario", "Alberta", "Quebec", "Manitoba", "Nova Scotia", "Yukon", null], 3);
  assert.deepEqual(out.map((o) => o.label), ["Ontario", "Alberta", "Manitoba", "Other"]);
  assert.equal(out[3].count, 3);
  assert.deepEqual(topCounts([]), []);
});

test("ratios never divide by zero", () => {
  assert.equal(ratio(10, 4), 2.5);
  assert.equal(ratio(1, 0), null);
  assert.equal(percent(1, 4), 25);
  assert.equal(percent(0, 0), null);
  assert.equal(change(5, 2), "Up 3 on the last period");
  assert.equal(change(2, 5), "Down 3 on the last period");
  assert.equal(change(2, 2), "Same as the last period");
  assert.equal(change(0, 0), "No change");
});

test("investor numbers", () => {
  const job = (employer_id: string, posted_at: string | null) => ({ employer_id, status: "live", posted_at, province: "Ontario", created_at: "2026-10-01T00:00:00Z" });
  const jobs = [job("a", "2026-10-01T00:00:00Z"), job("a", "2026-10-10T00:00:00Z"), job("b", "2026-10-02T00:00:00Z"), job("c", null)];
  const n = investorNumbers(jobs, 5);
  assert.equal(n.clinicsWithPosts, 2);
  assert.equal(n.postsPerClinic, 1.5);
  assert.equal(n.clinicsThatRepost, 50);
  // 5 applications over the 3 jobs ever published, not over however many happen to be live today.
  assert.equal(n.applicationsPerJob, 1.7);
  assert.equal(investorNumbers([], 0).postsPerClinic, null);
  assert.equal(investorNumbers([], 0).applicationsPerJob, null);
});

test("repeat clinics are those that post a second job within 60 days", () => {
  const job = (employer_id: string, posted_at: string | null) => ({ employer_id, status: "live", posted_at, province: "Ontario", created_at: "2026-10-01T00:00:00Z" });
  const jobs = [job("a", "2026-10-01T00:00:00Z"), job("a", "2026-11-15T00:00:00Z"), job("b", "2026-10-01T00:00:00Z"), job("b", "2027-03-01T00:00:00Z"), job("c", "2026-10-01T00:00:00Z"), job("d", null)];
  const r = repeatWithin(jobs, 60);
  assert.deepEqual(r, { clinicsWithPosts: 3, repeat: 1, percent: 33 });
  assert.equal(repeatWithin([]).percent, null);
});

test("gate C needs 50 live jobs in 5 provinces", () => {
  assert.deepEqual(gateC(12, 3), { jobs: { have: 12, need: 50, met: false }, provinces: { have: 3, need: 5, met: false } });
  assert.equal(gateC(50, 5).jobs.met && gateC(50, 5).provinces.met, true);
  assert.equal(gateC(60, 4).provinces.met, false);
});

test("hires: counts named hires, Kestrel without a name, and other sources, and how many clinics told us", () => {
  const job = (over: Partial<Parameters<typeof hiresSummary>[0][number]>) => ({ status: "closed", posted_at: "2026-11-01T00:00:00Z", filled_via: null, filled_application_id: null, ...over });
  const h = hiresSummary([
    job({ filled_via: "kestrel", filled_application_id: "a1" }),
    job({ filled_via: "kestrel" }),
    job({ status: "expired", filled_via: "indeed" }),
    job({ filled_via: "word_of_mouth" }),
    job({ status: "expired" }),
    job({ status: "live", posted_at: "2026-11-05T00:00:00Z" }),
    job({ status: "draft", posted_at: null }),
  ]);
  assert.equal(h.hiredThroughKestrel, 1);
  assert.equal(h.viaKestrelUnnamed, 1);
  assert.equal(h.filledElsewhere, 2);
  assert.equal(h.ended, 5);
  assert.equal(h.answered, 4);
  assert.equal(h.answerRate, 80);
  assert.deepEqual(h.elsewhere.filter((e) => e.count).map((e) => e.label), ["Indeed", "Word of mouth or a referral"]);
});

test("hires: with no ended jobs the answer rate is not a number", () => {
  const h = hiresSummary([]);
  assert.equal(h.answerRate, null);
  assert.equal(h.hiredThroughKestrel, 0);
});
