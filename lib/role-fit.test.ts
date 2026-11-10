// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { canApplyForRole, roleMismatchText } from "./role-fit.ts";

test("your own role, or one you added, is open to you", () => {
  assert.equal(canApplyForRole("Optician", [], "Optician"), true);
  assert.equal(canApplyForRole("Optician", ["Practice or clinic manager"], "Practice or clinic manager"), true);
});

test("an optician cannot apply for an optometrist job unless they add it", () => {
  assert.equal(canApplyForRole("Optician", [], "Optometrist"), false);
  assert.equal(canApplyForRole("Optician", ["Optometrist"], "Optometrist"), true);
  assert.equal(canApplyForRole("Optometrist", [], "Optometric assistant or technician"), false);
});

test("assistants, technicians and reception are flexible with each other, and nobody else is", () => {
  assert.equal(canApplyForRole("Patient care or reception", [], "Optometric assistant or technician"), true);
  assert.equal(canApplyForRole("Optometric assistant or technician", [], "Patient care or reception"), true);
  assert.equal(canApplyForRole("Patient care or reception", [], "Optician"), false);
  assert.equal(canApplyForRole("Optician", [], "Patient care or reception"), false);
});

test("with no role on the profile or no role on the job there is nothing to refuse", () => {
  assert.equal(canApplyForRole(null, [], "Optician"), true);
  assert.equal(canApplyForRole("Optician", [], undefined), true);
});

test("the message says what the job is for, what the profile says, and how to fix it", () => {
  const m = roleMismatchText("Optician", "Optometrist");
  assert.ok(m.startsWith("This role is for an optometrist. Your profile says optician."));
  assert.ok(m.includes("change your role in your profile to apply"));
  assert.ok(roleMismatchText("Optician", "Patient care or reception").includes("someone in patient care or reception"));
  assert.ok(!/[—–]/.test(m), "no long dashes");
});
