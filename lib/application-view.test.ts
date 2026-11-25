// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { viewApplication, viewForCandidate } from "./application-view.ts";

const row = { id: "a1", status: "shortlisted", clinic_message: "old note" };
const events = [
  { status: "applied", note: null, created_at: "2026-11-01T10:00:00Z" },
  { status: "viewed", note: null, created_at: "2026-11-02T10:00:00Z" },
  { status: "shortlisted", note: null, created_at: "2026-11-03T10:00:00Z" },
];

test("the clinic's version of a shortlisted application keeps Shortlisted and the shortlist step", () => {
  const { application, history } = viewApplication(row, events, "clinic");
  assert.equal(application.status, "shortlisted");
  assert.equal(application.clinic_message, "old note");
  assert.deepEqual(history.map((h) => h.status), ["applied", "viewed", "shortlisted"]);
});

test("the candidate's version of the same application still shows Viewed and hides the shortlist step", () => {
  const { application, history } = viewApplication(row, events, "candidate");
  assert.equal(application.status, "viewed");
  assert.equal(application.clinic_message, null);
  assert.deepEqual(history.map((h) => h.status), ["applied", "viewed"]);
});

test("other statuses are the same for both readers", () => {
  const interview = { id: "a2", status: "interview", clinic_message: "Come in Tuesday" };
  assert.deepEqual(viewForCandidate(interview), interview);
  assert.deepEqual(viewApplication(interview, events, "clinic").application, interview);
});

test("an open application whose clinic left shows as closed because the clinic left (migration 0044)", () => {
  const kept = viewForCandidate({ status: "viewed", clinic_message: null, job_id: null });
  assert.equal(kept.status, "clinic_left");
  assert.equal(viewForCandidate({ status: "shortlisted", clinic_message: "x", job_id: null }).status, "clinic_left", "a shortlist is never shown, even here");
  assert.equal(viewForCandidate({ status: "not_selected", clinic_message: "Thank you", job_id: null }).status, "not_selected", "a decision already made stays");
  assert.equal(viewForCandidate({ status: "applied", clinic_message: null, job_id: "j1" }).status, "applied", "a job still there changes nothing");
});
