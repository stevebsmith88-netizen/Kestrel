// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { applicantSnapshot, sentDetails } from "./application-details.ts";

const date = (iso: string) => `date:${iso}`;
const who = { name: "Sam Lee", email: "sam@example.com" };

test("the apply page lists all 8 things that are sent (P1-32)", () => {
  const a = applicantSnapshot(who, { profession: "Optician", phone: "416 555 0101", licensed_provinces: ["Ontario", "Alberta"], years_experience: "5 to 10 years", available_from: "2027-01-04" });
  const rows = sentDetails(a, "sam-resume.pdf", date);
  assert.deepEqual(rows.map((r) => r.label), ["Name", "Email", "Phone", "Role", "Registered in", "Years of experience", "Available from", "Resume"]);
  assert.deepEqual(rows.map((r) => r.value), ["Sam Lee", "sam@example.com", "416 555 0101", "Optician", "Ontario, Alberta", "5 to 10 years", "date:2027-01-04", "sam-resume.pdf"]);
});

test("empty details show Not given", () => {
  const rows = sentDetails(applicantSnapshot(who, { profession: "Optician" }), null, date);
  assert.deepEqual(rows.filter((r) => r.value === "Not given").map((r) => r.label), ["Phone", "Registered in", "Years of experience", "Available from", "Resume"]);
  assert.equal(sentDetails(applicantSnapshot(who, { licensed_provinces: [] }), "x.pdf", date).find((r) => r.label === "Registered in")?.value, "Not given");
});

test("every field that is sent is shown, and the real application is built from the same function", () => {
  const sent = Object.keys(applicantSnapshot(who, {})).sort();
  assert.deepEqual(sent, ["available_from", "email", "licensed_provinces", "name", "phone", "profession", "years_experience"]);
  assert.equal(sentDetails(applicantSnapshot(who, {}), null, date).length, sent.length + 1); // plus the resume file
  assert.match(readFileSync("lib/candidate-actions.ts", "utf8"), /applicant: applicantSnapshot\(/);
});
