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

test("the summary email counts new applications by job and carries the reply reminder", async () => {
  const { applicantDigestEmail, newApplicationEmail, RESPONSE_NOTE, cleanFrequency } = await import("./clinic-emails.ts");
  const mail = applicantDigestEmail({ jobs: [{ title: "Optician", count: 2 }, { title: "Assistant", count: 1 }] });
  assert.equal(mail.subject, "3 new applications on Kestrel");
  assert.ok(mail.text.includes("Optician: 2 new") && mail.text.includes("Assistant: 1 new"));
  assert.ok(mail.text.includes(RESPONSE_NOTE));
  assert.equal(applicantDigestEmail({ jobs: [{ title: "Optician", count: 1 }] }).subject, "1 new application on Kestrel");
  assert.ok(newApplicationEmail({ title: "Optician", applicationId: JOB }).html.includes(`/clinic/applications/${JOB}`));
  assert.equal(cleanFrequency("weekly"), "weekly");
  assert.equal(cleanFrequency("nonsense"), "each");
  for (const m of [mail, newApplicationEmail({ title: "T", applicationId: JOB })]) assert.ok(!m.html.includes("—") && !m.text.includes("—"));
});

test("summary emails go out every 2 to 3 days or weekly, and a daily job that runs late still counts", async () => {
  const { digestDue } = await import("./clinic-emails.ts");
  const now = new Date("2026-11-10T14:00:00Z");
  const ago = (hours: number) => new Date(now.getTime() - hours * 3600 * 1000);
  assert.equal(digestDue("few_days", null, now), true);
  assert.equal(digestDue("few_days", ago(24), now), false);
  assert.equal(digestDue("few_days", ago(47.5), now), true);
  assert.equal(digestDue("weekly", ago(5 * 24), now), false);
  assert.equal(digestDue("weekly", ago(7 * 24), now), true);
});
