// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { PASS_PLANS, coversRole, passChoices, passCounts, passDecision, passStatusLabel, passesOn, planByKey } from "./passes.ts";
import { CLINIC_PASS, CLINIC_PASS_PLUS } from "./pricing.ts";

const clinic = planByKey("clinic_pass")!;
const plus = planByKey("clinic_pass_plus")!;

test("the plans carry the prices and the 5 live posts from the pricing file", () => {
  assert.equal(PASS_PLANS.length, 2);
  assert.equal(clinic.monthly, CLINIC_PASS.monthly);
  assert.equal(plus.monthly, CLINIC_PASS_PLUS.monthly);
  assert.equal(clinic.livePosts, 5);
  assert.equal(plus.lookupKey, "clinic_pass_plus_monthly");
  assert.equal(planByKey("nonsense"), null);
});

test("the Clinic pass covers every role except optometrists, and Plus covers all", () => {
  for (const role of ["Optician", "Practice or clinic manager", "Optometric assistant or technician", "Patient care or reception"]) {
    assert.equal(coversRole(clinic, role), true, role);
    assert.equal(coversRole(plus, role), true, role);
  }
  assert.equal(coversRole(clinic, "Optometrist"), false);
  assert.equal(coversRole(plus, "Optometrist"), true);
});

test("a job is covered while a slot is free, and not once all 5 are in use or for a role the pass does not cover", () => {
  assert.deepEqual(passDecision(clinic, "Optician", 0), { kind: "covered" });
  assert.deepEqual(passDecision(clinic, "Optician", 4), { kind: "covered" });
  assert.deepEqual(passDecision(clinic, "Optician", 5), { kind: "full" });
  assert.deepEqual(passDecision(clinic, "Optometrist", 0), { kind: "role-not-covered" });
  assert.deepEqual(passDecision(plus, "Optometrist", 4), { kind: "covered" });
  assert.deepEqual(passDecision(plus, "Optometrist", 5), { kind: "full" });
});

test("only an active pass covers anything", () => {
  assert.equal(passCounts("active"), true);
  for (const s of ["past_due", "canceled", "incomplete", null, undefined]) assert.equal(passCounts(s), false, String(s));
});

test("plans are offered with a live key, or a test key only when trying checkout", () => {
  assert.equal(passesOn({ keyMode: "live", force: false }), true);
  assert.equal(passesOn({ keyMode: "test", force: false }), false);
  assert.equal(passesOn({ keyMode: "test", force: true }), true);
  assert.equal(passesOn({ keyMode: null, force: true }), false);
});

test("the words about a pass and about a job it did not cover", () => {
  assert.match(passStatusLabel("active", false), /renews each month/);
  assert.match(passStatusLabel("active", true), /then it stops/);
  assert.match(passStatusLabel("past_due", false), /overdue/);
});

test("the confirm page explains why, and offers a switch only when Plus would help", () => {
  const role = passChoices({ kind: "role-not-covered" }, clinic, "Optometrist");
  assert.match(role.headline, /does not cover optometrist jobs/);
  assert.equal(role.canUpgrade, true);
  assert.match(role.detail, /Clinic pass Plus covers every role/);
  const full = passChoices({ kind: "full" }, clinic, "Optician");
  assert.match(full.headline, /All 5 live posts on your Clinic pass are in use/);
  assert.equal(full.canUpgrade, false);
  assert.match(full.detail, /switching would not add room/);
  assert.equal(passChoices({ kind: "role-not-covered" }, plus, "Optometrist").canUpgrade, false);
});

test("the line under the name in the menu names the account and, once passes are offered, the plan", async () => {
  const { planLineText } = await import("./passes.ts");
  assert.equal(planLineText({ passesOn: false, planName: null }), "");
  assert.equal(planLineText({ passesOn: false, planName: "Clinic pass" }), "");
  assert.equal(planLineText({ passesOn: true, planName: null }), "Plan: Pay as you go");
  assert.equal(planLineText({ passesOn: true, planName: "Clinic pass Plus" }), "Plan: Clinic pass Plus");
});
