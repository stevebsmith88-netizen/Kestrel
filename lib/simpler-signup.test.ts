// Run with: npm test
// Pins Steve's decisions of 12th and 13th November 2026 (docs/audit/CLICK-COUNT-2026-11-12.md and the legal and setup plan), so they cannot
// slip back unnoticed: a shorter first application and first post, no career stage question, and first week emails only with the tick.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { MARKETING_CONSENT_TEXT } from "./auth-copy.ts";

const read = (path: string) => readFileSync(path, "utf8");

test("the first week emails go only to people who ticked the news box, and the box names them", () => {
  assert.match(read("lib/onboarding-run.ts"), /\.eq\("marketing_consent", true\)/);
  assert.match(MARKETING_CONSENT_TEXT, /tips for getting started/);
  assert.doesNotMatch(MARKETING_CONSENT_TEXT, /job alerts/, "job alerts are set up by the person, so the news box does not mention them");
});

test("the career stage question is gone from the first step page and the save step", () => {
  assert.doesNotMatch(read("components/FirstStepForm.tsx"), /careerStage|Where are you in eye care/);
  assert.doesNotMatch(read("lib/candidate-actions.ts"), /extra\.career_stage|cleanStage/);
  assert.doesNotMatch(read("app/privacy/page.tsx"), /where are you in eye care|career stage/i);
});

test("a first application is finished on the apply page, with no second question about a missing note", () => {
  assert.match(read("app/jobs/[id]/apply/page.tsx"), /<ApplySetup/);
  assert.doesNotMatch(read("components/ApplyForm.tsx"), /Send without a note/);
  assert.match(read("lib/apply-setup-actions.ts"), /uploadCv\(/, "the resume goes through exactly the same checks as the profile page");
});

test("a new clinic goes from its profile straight to its first post, and is never stopped by the staff count", () => {
  assert.match(read("lib/clinic-actions.ts"), /redirect\("\/clinic\/jobs\/new\?notice=profile-created"\)/);
  assert.doesNotMatch(read("lib/clinic-actions.ts"), /requireBand/);
  assert.match(read("app/clinic/page.tsx"), /if \(!employer\) redirect\("\/clinic\/profile"\)/);
  assert.match(read("app/clinic/profile/page.tsx"), /signUpEmail=\{session\.email\}/);
  assert.match(read("app/clinics/page.tsx"), /\/sign-up\?type=clinic/);
});

test("the in play check counts sent, viewed, shortlisted, interview and offer on a job the clinic still has", () => {
  const live = read("lib/live-applications.ts");
  assert.match(live, /\.in\("status", HIREABLE\)/);
  assert.match(live, /\.not\("job_id", "is", null\)/);
  assert.match(read("lib/account-settings-actions.ts"), /inPlay/);
  assert.match(read("content/help.ts"), /your name cannot change until it closes/);
});

test("withdrawing asks once, and the clinic is told without the candidate's name (Steve, 13th November 2026)", () => {
  const form = read("components/WithdrawForm.tsx");
  assert.match(form, /Yes, withdraw it/);
  assert.match(form, /Keep my application/);
  const action = read("lib/candidate-actions.ts");
  assert.match(action, /applicantWithdrew\(/);
  assert.match(action, /withdrawnEmail\(/);
  assert.doesNotMatch(read("lib/clinic-emails.ts").slice(read("lib/clinic-emails.ts").indexOf("export function withdrawnEmail")).split("export function")[1], /applicant\.name|\.name\b/);
});
