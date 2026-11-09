// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { BULK_PROBLEMS, declinedText, movedText } from "./bulk-notices.ts";

test("shortlisting says no email was sent, and counts people", () => {
  assert.equal(movedText("shortlisted", 1, 0), "1 applicant is now shortlisted. No email was sent.");
  assert.equal(movedText("shortlisted", 3, 0), "3 applicants are now shortlisted. No email was sent.");
});

test("an interview invitation says they were told, and anyone left as they were is counted", () => {
  assert.equal(movedText("interview", 2, 1), "2 applicants have been invited to interview, by email and in their account. 1 was left as they were, because they were already at that step or had withdrawn.");
  assert.equal(movedText("interview", 0, 2), "Nobody was moved. 2 were left as they were, because they were already at that step or had withdrawn.");
});

test("a kind no says how many were told, or that nobody was waiting", () => {
  assert.equal(declinedText(0), "Nobody was waiting, so no messages were sent.");
  assert.equal(declinedText(1), "1 candidate has been told, kindly, and can see it in their account.");
  assert.equal(declinedText(4), "4 candidates have been told, kindly, and can see it in their account.");
});

test("the problems are fixed sentences without long dashes", () => {
  for (const key of ["none", "message", "brackets"]) assert.ok(BULK_PROBLEMS[key] && !/[—–]/.test(BULK_PROBLEMS[key]), key);
});
