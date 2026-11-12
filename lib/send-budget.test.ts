// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DEFAULT_DAILY_BUDGET, budgetAfterClicks, dailyBudget, makeBudget, warnAt } from "./send-budget.ts";

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

// P1-24: emails sent by people pressing buttons share 1 count with the daily job.
test("the daily job only uses what clicks have left of the day's budget", () => {
  assert.equal(budgetAfterClicks(50, 0), 50);
  assert.equal(budgetAfterClicks(50, 30), 20);
  assert.equal(budgetAfterClicks(50, 50), 0);
  assert.equal(budgetAfterClicks(50, 80), 0);
  assert.equal(budgetAfterClicks(50, null), 50, "no count (before migration 0042): the job uses its own budget, as before");
});

test("the warning is at 80% of the budget, rounded up, and never at 0", () => {
  assert.equal(warnAt(50), 40);
  assert.equal(warnAt(100), 80);
  assert.equal(warnAt(7), 6);
  assert.equal(warnAt(0), 1);
});

test("every email sent is counted, and the daily job reads the count before it starts", () => {
  const email = readFileSync(new URL("./email.ts", import.meta.url), "utf8");
  assert.match(email, /await countSend\(\)/);
  const cron = readFileSync(new URL("../app/api/cron/daily/route.ts", import.meta.url), "utf8");
  assert.match(cron, /makeBudget\(budgetAfterClicks\(dailyBudget\(\), await emailsSentToday\(admin\)\)\)/);
});

test("migration 0042 is in the combined file, with its row in the final check", () => {
  const combined = readFileSync(new URL("../supabase/combined/run-everything.sql", import.meta.url), "utf8");
  assert.match(combined, /-- 0042_email_send_counts\.sql/);
  assert.match(combined, /table: email_send_counts/);
});
