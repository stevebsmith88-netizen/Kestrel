// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { PROVINCES, ROLE_CATEGORIES } from "./jobs.ts";
import { JOB_BANK_SOURCE, JOB_BANK_WAGES } from "./pay-benchmark-data.ts";
import { compareRange, describeBenchmark, findBenchmark, ownPayStats, plainDate, showMoney, type PostedPayRow } from "./pay-benchmark.ts";

const entry = (role: string, province: string, period: string, min: number, max: number) => ({ role, province, period, min, max });

test("the Job Bank file covers Ontario, Alberta and British Columbia for every mapped role, and other provinces where Job Bank publishes", () => {
  for (const province of ["Ontario", "Alberta", "British Columbia"]) {
    for (const role of ["Optometrist", "Optician", "Optometric assistant or technician", "Patient care or reception", "Practice or clinic manager"]) {
      assert.ok(JOB_BANK_WAGES.some((w) => w.role === role && w.province === province), `${role} in ${province}`);
    }
  }
  assert.ok(JOB_BANK_WAGES.some((w) => w.province === "Quebec") && JOB_BANK_WAGES.some((w) => w.province === "Nova Scotia"));
  // No row is kept twice.
  assert.equal(new Set(JOB_BANK_WAGES.map((w) => `${w.role}|${w.province}`)).size, JOB_BANK_WAGES.length);
});

test("every Job Bank row is sensible: known role and province, median present, quartiles in order, plausible size", () => {
  for (const w of JOB_BANK_WAGES) {
    assert.ok((ROLE_CATEGORIES as readonly string[]).includes(w.role));
    assert.ok((PROVINCES as readonly string[]).includes(w.province));
    assert.ok(w.median > 0);
    if (w.q1 !== null) assert.ok(w.q1 <= w.median);
    if (w.q3 !== null) assert.ok(w.q3 >= w.median);
    if (w.basis === "hour") assert.ok(w.median > 10 && w.median < 150, `${w.role} ${w.province} hourly`);
    else assert.ok(w.median > 20000 && w.median < 400000, `${w.role} ${w.province} yearly`);
  }
  assert.equal(JOB_BANK_SOURCE.revised, "2025-11-19");
});

test("hourly and yearly pay are put on one basis before they are compared", () => {
  const b = findBenchmark("Optician", "Ontario");
  assert.equal(b?.kind, "job_bank");
  if (b?.kind !== "job_bank") return;
  assert.ok(Math.abs(b.bands.median - 24.04 * 2080) < 1);
  // The same pay typed hourly or yearly gives the same answer.
  assert.equal(compareRange(24, 28, "hour", b.bands), compareRange(24 * 2080, 28 * 2080, "year", b.bands));
  assert.equal(compareRange(40, 45, "hour", b.bands), compareRange(40 * 2080, 45 * 2080, "year", b.bands));
  // Optometrists are published yearly. An hourly range is converted the other way.
  const o = findBenchmark("Optometrist", "Ontario");
  if (o?.kind !== "job_bank") throw new Error("expected Job Bank");
  assert.equal(o.bands.median, 78000);
  assert.equal(compareRange(37.5, 37.5, "hour", o.bands), compareRange(78000, 78000, "year", o.bands));
});

test("below, in line with and above use the middle of the range against the middle half of pay", () => {
  const bands = { low: 40000, median: 50000, high: 70000 };
  assert.equal(compareRange(30000, 38000, "year", bands), "below");
  assert.equal(compareRange(45000, 65000, "year", bands), "in_line");
  assert.equal(compareRange(40000, 40000, "year", bands), "in_line");
  assert.equal(compareRange(75000, 85000, "year", bands), "above");
  // With a median only, within 10% counts as in line.
  const medianOnly = { low: null, median: 100000, high: null };
  assert.equal(compareRange(95000, 105000, "year", medianOnly), "in_line");
  assert.equal(compareRange(80000, 85000, "year", medianOnly), "below");
  assert.equal(compareRange(115000, 125000, "year", medianOnly), "above");
});

test("the wording says typical and median, shows the source and date, and never says national average", () => {
  const b = findBenchmark("Optician", "Ontario");
  if (!b) throw new Error("expected a benchmark");
  const m = describeBenchmark(entry("Optician", "Ontario", "hour", 20, 22), b);
  assert.equal(m.verdict, "below");
  assert.match(m.lead, /^Your range is below what is typical for opticians in Ontario\.$/);
  assert.match(m.detail, /median is about \$24\.04 an hour/);
  assert.match(m.detail, /\$23\.00 an hour to \$33\.65 an hour/);
  assert.equal(m.short, "Source: Job Bank, Government of Canada. Guidance only.");
  assert.match(m.source, /Job Bank wages, Government of Canada/);
  assert.match(m.source, /Labour Force Survey 2023 to 2024\. Job Bank file of 19th November 2025/);
  assert.match(m.caution, /cover 2023 to 2024/);
  assert.match(m.caution, /Guidance only\. It does not stop you posting/);
  assert.equal(m.licence, true);
  assert.doesNotMatch(JSON.stringify(m), /national average|average pay/i);
  assert.doesNotMatch(JSON.stringify(m), /—|–/);
  assert.equal(describeBenchmark(entry("Optician", "Ontario", "hour", 25, 30), b).lead, "Your range is in line with what is typical for opticians in Ontario.");
  assert.equal(describeBenchmark(entry("Optician", "Ontario", "hour", 40, 50), b).lead, "Your range is above what is typical for opticians in Ontario.");
});

test("before a range is typed the guide shows the typical pay only, in the basis chosen", () => {
  const b = findBenchmark("Optometrist", "Alberta");
  if (!b) throw new Error("expected a benchmark");
  const m = describeBenchmark(entry("Optometrist", "Alberta", "year", 0, 0), b);
  assert.equal(m.verdict, null);
  assert.equal(m.lead, "Typical pay for optometrists in Alberta.");
  assert.match(m.detail, /median is about \$84,000 a year/);
  assert.match(m.source, /2021 Census\. Job Bank file of 19th November 2025/);
  assert.match(m.caution, /cover 2021/);
  assert.equal(showMoney(24.04 * 2080, "year"), "$50,000 a year");
});

test("a closest group match says so", () => {
  const b = findBenchmark("Optometric assistant or technician", "British Columbia");
  if (b?.kind !== "job_bank") throw new Error("expected Job Bank");
  assert.equal(b.closest, true);
  assert.match(describeBenchmark(entry(b.role, b.province, "hour", 20, 24), b).source, /closest Job Bank group/);
  const exact = findBenchmark("Optician", "British Columbia");
  if (exact?.kind !== "job_bank") throw new Error("expected Job Bank");
  assert.doesNotMatch(describeBenchmark(entry("Optician", "British Columbia", "hour", 20, 24), exact).source, /closest/);
});

test("with no official figure and no Kestrel data there is nothing to show", () => {
  assert.equal(findBenchmark("Vision therapist", "Ontario"), null);
  assert.equal(findBenchmark("Optician", "Prince Edward Island"), null);
  assert.equal(findBenchmark("Sales or territory representative", "Ontario"), null);
});

const posts = (n: number, clinics: number, role = "Vision therapist", province = "Ontario", pay = 30): PostedPayRow[] =>
  Array.from({ length: n }, (_, i) => ({ employer_id: `c${i % clinics}`, role_category: role, province, pay_period: "hour", pay_min: pay, pay_max: pay + 4 }));

test("Kestrel's own pay is used only from 10 posts by at least 3 clinics", () => {
  assert.deepEqual(ownPayStats(posts(9, 5)), []);
  assert.deepEqual(ownPayStats(posts(12, 2)), []);
  const stats = ownPayStats(posts(10, 3));
  assert.equal(stats.length, 1);
  assert.equal(stats[0].posts, 10);
  assert.equal(stats[0].median, 32 * 2080);
  const b = findBenchmark("Vision therapist", "Ontario", stats);
  assert.equal(b?.kind, "kestrel");
  const m = describeBenchmark(entry("Vision therapist", "Ontario", "hour", 30, 34), b!);
  assert.equal(m.verdict, "in_line");
  assert.match(m.source, /10 posts on Kestrel/);
  assert.equal(m.licence, false);
});

test("official Job Bank figures come before Kestrel's own, and hourly and yearly posts are mixed on one basis", () => {
  const mixed: PostedPayRow[] = [...posts(6, 3, "Optician"), ...posts(6, 3, "Optician").map((p) => ({ ...p, pay_period: "year", pay_min: 62400, pay_max: 83200 }))];
  const stats = ownPayStats(mixed);
  assert.equal(stats[0].posts, 12);
  // 6 posts at $32 an hour ($66,560 a year) and 6 at $72,800 a year: the median sits halfway between them.
  assert.equal(stats[0].median, (66560 + 72800) / 2);
  assert.equal(findBenchmark("Optician", "Ontario", stats)?.kind, "job_bank");
});

test("bad rows are ignored", () => {
  const bad: PostedPayRow[] = [...posts(9, 3), { employer_id: "x", role_category: "Vision therapist", province: "Ontario", pay_period: "week", pay_min: 5, pay_max: 6 }, { employer_id: "y", role_category: "Vision therapist", province: "Ontario", pay_period: "hour", pay_min: 0, pay_max: 0 }];
  assert.deepEqual(ownPayStats(bad), []);
});

test("dates read as ordinal dates", () => {
  assert.equal(plainDate("2025-11-19"), "19th November 2025");
  assert.equal(plainDate("2026-01-01"), "1st January 2026");
  assert.equal(plainDate("2026-03-22"), "22nd March 2026");
});
