// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { jobFromForm } from "./job-form.ts";

const filled = () => {
  const form = new FormData();
  const values: Record<string, string> = {
    title: "Optician", roleCategory: "Optician", employmentType: "Full time", province: "British Columbia", city: "Victoria", payPeriod: "year",
    payMin: "$62,000", payMax: "74000", existingVacancy: "yes", usesAi: "no", applyMethod: "kestrel", workArrangement: "on_site",
    description: "Join a friendly, busy independent clinic as our full time optician and work closely with our team.",
  };
  for (const [k, v] of Object.entries(values)) form.set(k, v);
  return form;
};

test("a complete form becomes a job in review with clean numbers and answers", () => {
  const { row, errors } = jobFromForm(filled(), true);
  assert.deepEqual(errors, {});
  assert.equal(row.status, "in_review");
  assert.equal(row.pay_min, 62000);
  assert.equal(row.is_existing_vacancy, true);
  assert.equal(row.uses_ai_screening, false);
});

test("a draft needs only a title, but sending for review needs the pay range and the 2 questions", () => {
  const draft = new FormData();
  draft.set("title", "Optician");
  assert.deepEqual(jobFromForm(draft, false).errors, {});
  assert.equal(jobFromForm(draft, false).row.status, "draft");
  const missing = filled();
  missing.delete("payMin");
  missing.delete("usesAi");
  const errors = jobFromForm(missing, true).errors;
  assert.ok(errors.payMin || errors.payMax, "pay range is required");
  assert.ok(errors.usesAi, "the AI question is required");
});
