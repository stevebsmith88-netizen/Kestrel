// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { CAREER_STAGES, cleanStage } from "./career-stage.ts";

test("only the 3 plain answers are accepted", () => {
  assert.equal(cleanStage("working"), "working");
  assert.equal(cleanStage("studying"), "studying");
  assert.equal(cleanStage("not_yet"), "not_yet");
  assert.equal(cleanStage("returning"), null);
  assert.equal(cleanStage(""), null);
  assert.equal(cleanStage(undefined), null);
});

test("the wording is plain facts, with nothing about age, family or health", () => {
  const words = CAREER_STAGES.map((s) => s.label).join(" ").toLowerCase();
  for (const bad of ["return", "newly", "graduate", "gap", "break", "leave", "retire", "young", "senior"]) assert.ok(!words.includes(bad), bad);
});
