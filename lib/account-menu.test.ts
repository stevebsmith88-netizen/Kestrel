// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { ACCOUNT_MENU, initialsOf } from "./account-menu.ts";

test("every kind of account has Account settings, and candidates and clinics have their profile", () => {
  for (const role of ["candidate", "clinic", "admin"] as const) assert.ok(ACCOUNT_MENU[role].some((l) => l.href === "/account"), role);
  assert.ok(ACCOUNT_MENU.candidate.some((l) => l.href === "/candidate/profile"));
  assert.ok(ACCOUNT_MENU.clinic.some((l) => l.href === "/clinic/profile"));
});

test("initials come from the first and last name, or the email when there is no name", () => {
  assert.equal(initialsOf("Jordan Lee", "j@x.ca"), "JL");
  assert.equal(initialsOf("Priya Anne Raman", "p@x.ca"), "PR");
  assert.equal(initialsOf("Alex", "a@x.ca"), "A");
  assert.equal(initialsOf("", "zed@x.ca"), "Z");
});
