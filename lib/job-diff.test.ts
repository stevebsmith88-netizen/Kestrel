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
