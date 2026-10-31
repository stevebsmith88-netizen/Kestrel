// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { jobLiveEmail, jobNeedsChangeEmail } from "./clinic-emails.ts";

const JOB = "a0000000-0000-4000-8000-000000000003";

test("the live email names the job, says how long it stays up, and links to it", () => {
  const mail = jobLiveEmail({ title: "Optician", jobId: JOB, expiresLabel: "1st December 2026", wasEdit: false });
  assert.equal(mail.subject, "Your Optician job is live");
  assert.ok(mail.text.includes("1st December 2026"));
  assert.ok(mail.html.includes(`/jobs/${JOB}`));
  assert.ok(!mail.html.includes("unsubscribe"));
});

test("an approved edit says the changes are live", () => {
  const mail = jobLiveEmail({ title: "Optician", jobId: JOB, expiresLabel: null, wasEdit: true });
  assert.equal(mail.subject, "Your changes to Optician are live");
});

test("the needs a change email passes on the note and links to the editor", () => {
  const mail = jobNeedsChangeEmail({ title: "Optician", jobId: JOB, note: "Please add the pay range." });
  assert.equal(mail.subject, "Your Optician job needs a change");
  assert.ok(mail.text.includes("Please add the pay range."));
  assert.ok(mail.html.includes(`/clinic/jobs/${JOB}`));
});

test("no em dashes in anything a clinic reads", () => {
  for (const mail of [jobLiveEmail({ title: "T", jobId: JOB, expiresLabel: "x", wasEdit: false }), jobNeedsChangeEmail({ title: "T", jobId: JOB, note: "n" })]) {
    assert.ok(!mail.html.includes("—") && !mail.text.includes("—") && !mail.subject.includes("—"));
  }
});
