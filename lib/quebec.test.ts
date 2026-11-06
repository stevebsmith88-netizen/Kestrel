// Run with: npm test
// Kestrel is in English for now: a job in Quebec is refused, Quebec stays a choice on the forms (people moving to other provinces are
// welcome), and there is no Quebec pay guidance. Steve's decision, 6th November 2026.
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanFoundInput, validateFoundInput } from "./found-listings.ts";
import { cleanJob, PROVINCES, validateJob } from "./jobs.ts";
import { findBenchmark } from "./pay-benchmark.ts";
import { QUEBEC, QUEBEC_JOB_MESSAGE, QUEBEC_JOIN_NOTE } from "./waitlist.ts";

test("a job in Quebec is refused, as a draft and when submitted, with a friendly message", () => {
  const job = cleanJob({ title: "Optician", province: "Quebec" });
  assert.equal(validateJob(job, false).province, QUEBEC_JOB_MESSAGE);
  assert.equal(validateJob(job, true).province, QUEBEC_JOB_MESSAGE);
  assert.match(QUEBEC_JOB_MESSAGE, /English for now/);
  assert.match(QUEBEC_JOB_MESSAGE, /planned for a later date/);
});

test("a job in another province is not refused for its province", () => {
  assert.equal(validateJob(cleanJob({ title: "Optician", province: "Ontario" }), false).province, undefined);
});

test("a found listing and a province search in Quebec are refused too", () => {
  const found = cleanFoundInput({ province: "Quebec", city: "Montreal", title: "Optician" });
  assert.equal(validateFoundInput(found).province, QUEBEC_JOB_MESSAGE);
});

test("Quebec stays a choice on the forms, and the note for people joining is welcoming", () => {
  assert.ok((PROVINCES as readonly string[]).includes(QUEBEC));
  assert.match(QUEBEC_JOIN_NOTE, /still join the waitlist/);
  assert.match(QUEBEC_JOIN_NOTE, /other provinces/);
});

test("there is no pay guidance for Quebec, while other provinces keep theirs", () => {
  assert.equal(findBenchmark("Optician", "Quebec"), null);
  assert.ok(findBenchmark("Optician", "Ontario"));
});
