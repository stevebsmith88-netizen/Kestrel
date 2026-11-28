// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { allDone, candidateSteps, clinicSteps, lookingForSaved, nextStep } from "./checklist.ts";

test("a new clinic starts at the profile and the list ends at the first application", () => {
  const steps = clinicSteps({ hasProfile: false, submitted: 0, live: 0, applications: 0 });
  assert.equal(steps.length, 4);
  assert.equal(nextStep(steps)?.label, "Set up your clinic profile");
  assert.equal(allDone(steps), false);
  assert.equal(allDone(clinicSteps({ hasProfile: true, submitted: 1, live: 1, applications: 1 })), true);
});

test("clinic steps tick off in order of what the clinic has done", () => {
  const steps = clinicSteps({ hasProfile: true, submitted: 1, live: 0, applications: 0 });
  assert.deepEqual(steps.map((s) => s.done), [true, true, false, false]);
  assert.equal(nextStep(steps)?.label, "Get it live");
});

test("a candidate is done once they have applied, and every link goes somewhere on the site", () => {
  const steps = candidateSteps({ profileReady: true, lookingFor: true, hasAlert: true, applications: 1 });
  assert.equal(allDone(steps), true);
  assert.equal(nextStep(steps), null);
  for (const s of [...clinicSteps({ hasProfile: false, submitted: 0, live: 0, applications: 0 }), ...candidateSteps({ profileReady: false, lookingFor: false, hasAlert: false, applications: 0 })]) assert.ok(s.href.startsWith("/"));
});

test("the candidate checklist does not say Kestrel drafts cover letters (P1-07)", () => {
  const text = candidateSteps({ profileReady: false, lookingFor: false, hasAlert: false, applications: 0 }).map((s) => `${s.label} ${s.detail}`).join(" ");
  assert.doesNotMatch(text, /draft a cover letter|Kestrel can draft/i);
  assert.match(text, /save a cover letter/i);
});

test("Say what you are looking for is done only once a preference is saved (D-04)", () => {
  assert.equal(lookingForSaved(null), false);
  assert.equal(lookingForSaved({ pref_provinces: [], pref_employment_types: [], pref_other_roles: [], pref_min_pay: null, pref_practice: null }), false);
  assert.equal(lookingForSaved({ pref_provinces: ["AB"] }), true);
  assert.equal(lookingForSaved({ pref_min_pay: 25 }), true);
  assert.equal(lookingForSaved({ pref_practice: "independent" }), true);
  assert.equal(lookingForSaved({ pref_employment_types: ["Full time"] }), true);
});
