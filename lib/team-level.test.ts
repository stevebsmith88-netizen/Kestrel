// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Audit P2-01 and P2-02 (27th November 2026). Someone can be on several clinics' teams at different levels (migration 0047), and the database
// lets them read every clinic they are on. Changes to applicants are made with the server key, so the website must check the level at the clinic
// the job belongs to, never the location the person has picked. These checks read the code, since the actions need a real sign in to run.

const read = (path: string) => readFileSync(path, "utf8");

// Each exported action's own text, from its "export async function" line to the next one.
function actions(source: string): Map<string, string> {
  const parts = source.split(/\n(?=export async function )/);
  const out = new Map<string, string>();
  for (const part of parts) {
    const name = /^export async function (\w+)/.exec(part)?.[1];
    if (name) out.set(name, part);
  }
  return out;
}

test("applicant actions never take the level from the picked location", () => {
  const source = read("lib/applicant-actions.ts");
  assert.doesNotMatch(source, /getMyEmployer|getMyEditableEmployer/, "lib/applicant-actions.ts must check the level at the job's own clinic (levelForJob or levelAt)");
});

test("every action that changes an applicant checks the level at the job's own clinic", () => {
  const all = actions(read("lib/applicant-actions.ts"));
  const moving = ["declineSelected", "shortlistSelectedQuiet", "declineSelectedQuiet", "fillRole", "setApplicationStatus"];
  for (const name of moving) {
    const body = all.get(name);
    assert.ok(body, `${name} is missing from lib/applicant-actions.ts`);
    assert.match(body, /mayMoveOnJob\(session\.userId, (jobId|app\.job_id)\)/, `${name} must call mayMoveOnJob for the job it changes`);
  }
  const note = all.get("saveApplicantNote");
  assert.ok(note);
  assert.match(note, /levelAt\(session\.userId, employerId\)/, "saveApplicantNote must take the level from the application's own clinic");
  assert.match(note, /eq\("id", employerId\)/, "a view only note must tell the owner of the application's own clinic");
});

test("the applicant pages show buttons by the level at the job's own clinic", () => {
  for (const path of ["app/clinic/jobs/[id]/applicants/page.tsx", "app/clinic/applications/[id]/page.tsx"]) {
    const source = read(path);
    assert.match(source, /canEdit\(await levelForJob\(session\.userId, /, `${path} must use levelForJob`);
    assert.doesNotMatch(source, /getMyEmployer/, `${path} must not take the level from the picked location`);
  }
});

test("saving a job refuses one that belongs to another location", () => {
  const body = actions(read("lib/clinic-actions.ts")).get("saveJob");
  assert.ok(body);
  assert.match(body, /select\("status, employer_id"\)/);
  assert.match(body, /current\.employer_id !== employer\.id\) return \{ error: OTHER_LOCATION_TEXT \}/);
});
