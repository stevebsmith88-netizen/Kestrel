// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { provincesOnTop, roleSummaries, yearly } from "./pay-summary.ts";
import type { JobBankWage } from "./pay-benchmark-data.ts";

const w = (role: string, province: string, median: number, extra: Partial<JobBankWage> = {}): JobBankWage => ({
  role, province, median, noc: "32100", occupation: "Opticians", match: "exact", basis: "hour", q1: null, q3: null, survey: "Labour Force Survey", period: "2023-2024", ...extra,
});

test("each role gets its highest and lowest province and the gap between them", () => {
  const [optician] = roleSummaries([w("Optician", "Ontario", 24), w("Optician", "British Columbia", 30), w("Optician", "Alberta", 28)]);
  assert.equal(optician.highest.province, "British Columbia");
  assert.equal(optician.lowest.province, "Ontario");
  assert.equal(optician.gap, 6);
  assert.equal(optician.gapPercent, 25);
  assert.equal(optician.provinces, 3);
});

test("optometrists and Quebec stay out, as on the public pay table", () => {
  const rows = roleSummaries([w("Optometrist", "Ontario", 60), w("Optician", "Quebec", 99), w("Optician", "Ontario", 24), w("Optician", "Alberta", 28)]);
  assert.deepEqual(rows.map((r) => r.role), ["Optician"]);
  assert.equal(rows[0].highest.province, "Alberta");
});

test("a province tied for the top figure counts for each role it shares", () => {
  const top = provincesOnTop([w("Optician", "Alberta", 30), w("Optician", "Ontario", 30), w("Patient care or reception", "Ontario", 20), w("Patient care or reception", "Alberta", 19)]);
  assert.deepEqual(top, [{ province: "Ontario", roles: 2 }, { province: "Alberta", roles: 1 }]);
});

test("the real figures give a summary for all 4 public roles", () => {
  const rows = roleSummaries();
  assert.equal(rows.length, 4);
  for (const r of rows) assert.ok(r.gap > 0 && r.highest.median > r.lowest.median, r.role);
  assert.equal(yearly(24.04), "$50,000");
});
