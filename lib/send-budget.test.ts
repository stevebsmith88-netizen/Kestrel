// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_DAILY_BUDGET, dailyBudget, makeBudget } from "./send-budget.ts";

test("the budget allows exactly its limit and then says no", () => {
  const budget = makeBudget(2);
  assert.deepEqual([budget.take(), budget.take(), budget.take(), budget.take()], [true, true, false, false]);
  assert.equal(budget.used, 2);
  assert.equal(budget.left, 0);
});

test("a refund gives one send back", () => {
  const budget = makeBudget(1);
  assert.equal(budget.take(), true);
  assert.equal(budget.take(), false);
  budget.refund();
  assert.equal(budget.take(), true);
});

test("the daily limit comes from DAILY_EMAIL_BUDGET, with a safe default", () => {
  assert.equal(dailyBudget({}), DEFAULT_DAILY_BUDGET);
  assert.equal(dailyBudget({ DAILY_EMAIL_BUDGET: "" }), DEFAULT_DAILY_BUDGET);
  assert.equal(dailyBudget({ DAILY_EMAIL_BUDGET: "abc" }), DEFAULT_DAILY_BUDGET);
  assert.equal(dailyBudget({ DAILY_EMAIL_BUDGET: "-5" }), DEFAULT_DAILY_BUDGET);
  assert.equal(dailyBudget({ DAILY_EMAIL_BUDGET: "200" }), 200);
  assert.equal(dailyBudget({ DAILY_EMAIL_BUDGET: "0" }), 0);
  assert.equal(dailyBudget({ DAILY_EMAIL_BUDGET: "999999" }), 5000);
});
