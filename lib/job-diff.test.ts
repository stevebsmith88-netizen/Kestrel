// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { changedFields } from "./job-diff.ts";

const before = { title: "Optician", pay_min: 60000, pay_max: "80000.00", pay_extras: null, is_existing_vacancy: true, description: "A friendly clinic.", territory: "" };

test("nothing is listed when only the formatting differs", () => {
  assert.deepEqual(changedFields(before, { ...before, pay_max: 80000, pay_extras: "", territory: null }), []);
});

test("each changed field is listed with the old and new wording", () => {
  const changes = changedFields(before, { ...before, title: "Senior optician", pay_min: 65000, is_existing_vacancy: false, pay_extras: "Bonus" });
  assert.deepEqual(changes.map((c) => c.label), ["Title", "Pay minimum", "Anything else that is part of the pay", "Existing vacancy"]);
  assert.deepEqual(changes[0], { label: "Title", before: "Optician", after: "Senior optician" });
  assert.deepEqual(changes[2], { label: "Anything else that is part of the pay", before: "(empty)", after: "Bonus" });
  assert.deepEqual(changes[3], { label: "Existing vacancy", before: "Yes", after: "No" });
});

test("pay basis and tag changes are listed, and an older copy with no new columns shows no false change", () => {
  const old = { title: "Optometrist", pay_period: "year", pay_min: 90000, pay_max: 110000 };
  assert.deepEqual(changedFields(old, { ...old, pay_is_minimum: false, tags_software: [], tags_equipment: [], tags_specialties: [], pay_percent_min: null }), []);
  const changes = changedFields(old, { ...old, tags_software: ["Wink", "Acuitas"], pay_period: "day", pay_is_minimum: true, pay_percent_min: 28, pay_percent_of: "production" });
  const labels = changes.map((c) => c.label);
  assert.ok(labels.includes("Practice software") && labels.includes("Dollars are a guaranteed minimum") && labels.includes("Percentage, lowest"));
  assert.equal(changes.find((c) => c.label === "Practice software")?.after, "Wink, Acuitas");
  assert.equal(changes.find((c) => c.label === "Practice software")?.before, "(empty)");
  assert.equal(changes.find((c) => c.label === "Dollars are a guaranteed minimum")?.before, "No");
});
