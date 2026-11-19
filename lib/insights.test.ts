// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildInsights, insightsRows, showCount } from "./insights.ts";

test("a count under 5 never shows as a number", () => {
  assert.equal(showCount(0), "0");
  assert.equal(showCount(1), "fewer than 5");
  assert.equal(showCount(4), "fewer than 5");
  assert.equal(showCount(5), "5");
  assert.equal(showCount(1200), "1,200");
});

const job = (employer_id: string, role: string, province: string, extra = {}) => ({
  employer_id, role_category: role, province, pay_period: "hour", pay_min: 30, pay_max: 34,
  is_seeded: false, status: "live", posted_at: "2026-11-01", ...extra,
});

test("clinics, suppliers and candidates are counted apart, with small counts hidden", () => {
  const employers = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, practice_type: "independent", owner_id: `u${i}` })),
    { id: "s1", practice_type: "supplier", owner_id: "us1" },
    { id: "found", practice_type: "independent", owner_id: null },
  ];
  const jobs = [
    ...employers.slice(0, 6).map((e) => job(e.id, "Optician", "Ontario")),
    job("s1", "Sales representative", "Ontario"),
    job("found", "Optician", "Ontario", { is_seeded: true }),
    job("c0", "Optician", "Ontario", { status: "draft" }),
  ];
  const i = buildInsights({ candidates: [{ profession: "Optician", home_province: "Ontario" }, { profession: null, home_province: null }], employers, jobs });
  assert.equal(i.clinics.registered, 6);
  assert.equal(i.clinics.postsTotal, 6);
  assert.equal(i.suppliers.registeredShown, "fewer than 5");
  assert.equal(i.suppliers.rolesPosted, 1);
  assert.equal(i.candidates.byProfession.find((c) => c.label === "Not given")?.shown, "fewer than 5");
  assert.equal(i.pay.length, 0, "6 posts is under the 10 post rule");
});

test("pay shows only with enough posts from enough clinics, in typical and median wording, with no names", () => {
  const employers = Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, practice_type: "independent", owner_id: `u${i}` }));
  const jobs = Array.from({ length: 12 }, (_, i) => job(`c${i % 4}`, "Optician", "Ontario"));
  const i = buildInsights({ candidates: [], employers, jobs });
  assert.equal(i.pay.length, 1);
  assert.match(i.pay[0].median, /^\$\d/);
  const text = JSON.stringify(insightsRows(i)) + i.payRule;
  assert.doesNotMatch(text, /national average|"c0"|"u0"/);
  assert.match(i.payRule, /typical|median/);
});
