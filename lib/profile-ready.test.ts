// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { missingSentence, missingToApply, readyToApply } from "./profile-ready.ts";

const full = { profession: "Optician", cv_path: "a/b.pdf", home_city: "Toronto", home_province: "Ontario" };

test("a role, a resume and a town with its province are needed, and nothing else", () => {
  assert.equal(readyToApply(full), true);
  assert.equal(readyToApply(null), false);
  assert.deepEqual(missingToApply(null), ["Your role", "Your resume", "Your town and province"]);
  assert.deepEqual(missingToApply({ ...full, cv_path: null }), ["Your resume"]);
  assert.deepEqual(missingToApply({ ...full, home_province: null }), ["Your town and province"]);
});

test("the missing things read as a sentence", () => {
  assert.equal(missingSentence({ profession: "Optician" }), "your resume and your town and province");
  assert.equal(missingSentence(null), "your role, your resume and your town and province");
  assert.equal(missingSentence({ ...full, cv_path: null }), "your resume");
  assert.equal(missingSentence(full), "");
});
