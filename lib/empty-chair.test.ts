// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { CHAIR_DEFAULTS, emptyChairCost, roughDollars } from "./empty-chair.ts";

test("the example clinic works out as the blog post says", () => {
  const r = emptyChairCost(CHAIR_DEFAULTS);
  // 230 x 41% x 10% = 9.43 sales a month, at $500
  assert.equal(roughDollars(r.glasses), "$4,700");
  // 5 hours a week x 2 exams an hour x 52/12 weeks x $200
  assert.equal(roughDollars(r.examTime), "$8,700");
  assert.equal(roughDollars(r.total), "$13,400");
});

test("blank, negative or silly values count as 0, and shares stop at 100%", () => {
  const r = emptyChairCost({ ...CHAIR_DEFAULTS, examsPerMonth: Number.NaN, dispensingHoursPerWeek: -3 });
  assert.equal(r.total, 0);
  const all = emptyChairCost({ ...CHAIR_DEFAULTS, needGlassesPercent: 250, lostSalesPercent: 100, dispensingHoursPerWeek: 0 });
  assert.equal(all.lostSales, 230);
});
