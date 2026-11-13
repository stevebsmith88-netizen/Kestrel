// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { applicationMoved, applicationNoUpdate, closedAfterTalksText, inboxTarget, jobApproved, jobNeedsChange, newApplicant } from "./notify-text.ts";

test("a candidate is told about a visible step, with the clinic's message if there is one", () => {
  const m = applicationMoved({ jobTitle: "Optician", clinicName: "Riverside", status: "interview", label: "Interview", message: "We would like to meet you.", applicationId: "a1" });
  assert.equal(m?.title, "Optician: Interview");
  assert.ok(m?.body?.includes("We would like to meet you."));
  assert.equal(m?.href, "/candidate/applications/a1");
});

test("a shortlist is never announced to the candidate", () => {
  assert.equal(applicationMoved({ jobTitle: "Optician", clinicName: "Riverside", status: "shortlisted", label: "Shortlisted", applicationId: "a1" }), null);
});

test("a clinic is told about a new applicant without the applicant's details", () => {
  const m = newApplicant({ jobTitle: "Optician", applicationId: "a1" });
  assert.equal(m.title, "New application for Optician");
  assert.equal(m.href, "/clinic/applications/a1");
});

test("job messages say what happened and where to go", () => {
  assert.equal(jobApproved({ jobTitle: "Optician", jobId: "j1", wasEdit: false }).title, "Optician is live");
  assert.equal(jobApproved({ jobTitle: "Optician", jobId: "j1", wasEdit: true }).title, "Your changes to Optician are live");
  const n = jobNeedsChange({ jobTitle: "Optician", jobId: "j1", note: "Add the pay range." });
  assert.ok(n.body?.includes("Add the pay range."));
  assert.equal(n.href, "/clinic/jobs/j1");
});

test("long titles and messages are cut to fit, and no message uses a long dash", () => {
  const m = applicationMoved({ jobTitle: "x".repeat(300), clinicName: "C", status: "offer", label: "Offer", message: "y".repeat(900), applicationId: "a" });
  assert.ok((m?.title.length ?? 999) <= 160 && (m?.body?.length ?? 999) <= 500);
  const all = [m, newApplicant({ jobTitle: "T", applicationId: "a" }), jobNeedsChange({ jobTitle: "T", jobId: "j", note: "" })].map((x) => `${x?.title} ${x?.body}`).join(" ");
  assert.ok(!/[—–]/.test(all));
});

test("a candidate is told in the inbox when a job closes with no decision (P1-35)", () => {
  const m = applicationNoUpdate({ jobTitle: "Optician", clinicName: "Harbourside Optical", label: "No update from the clinic", applicationId: "a1" });
  assert.equal(m.kind, "application");
  assert.equal(m.title, "Optician: No update from the clinic");
  assert.match(m.body ?? "", /Harbourside Optical/);
  assert.match(m.body ?? "", /did not send a decision/);
  assert.equal(m.href, "/candidate/applications/a1");
  assert.doesNotMatch(JSON.stringify(m), /[–—]/);
});

test("someone at Interview or Offer on a job that ran out gets the kinder wording (X-04)", () => {
  const m = applicationNoUpdate({ jobTitle: "Optician", clinicName: "Harbourside Optical", label: "No update from the clinic", applicationId: "a1", afterTalks: true });
  assert.equal(m.body, closedAfterTalksText("Harbourside Optical"));
  assert.match(m.body ?? "", /contact the clinic directly/);
  assert.doesNotMatch(JSON.stringify(m), /[–—]/);
});

test("the daily job closes Interview and Offer too, later, and leaves jobs the clinic marked filled (X-04)", async () => {
  const { readFileSync } = await import("node:fs");
  const cron = readFileSync("app/api/cron/daily/route.ts", "utf8");
  assert.match(cron, /\["interview", "offer"\]/);
  assert.match(cron, /is\("filled_at", null\)/);
  assert.match(cron, /afterTalks: true/);
});

test("the daily job sends that inbox message when it closes an application", async () => {
  const { readFileSync } = await import("node:fs");
  const cron = readFileSync("app/api/cron/daily/route.ts", "utf8");
  assert.match(cron, /applicationNoUpdate\(/);
  assert.ok(cron.indexOf("applicationNoUpdate(") > cron.indexOf('status: "no_update", status_changed_at'), "after the application is closed");
});

test("Open only ever goes to a page on this site (P1-36)", () => {
  
  assert.equal(inboxTarget("/candidate/applications/a1"), "/candidate/applications/a1");
  assert.equal(inboxTarget(null), "/account/inbox");
  assert.equal(inboxTarget("https://evil.example"), "/account/inbox");
  assert.equal(inboxTarget("//evil.example"), "/account/inbox");
});

test("opening a message marks it read before it redirects, and the inbox page uses the action", async () => {
  const { readFileSync } = await import("node:fs");
  const actions = readFileSync("lib/notification-actions.ts", "utf8");
  const open = actions.slice(actions.indexOf("export async function openMessage"), actions.indexOf("export async function markOneRead"));
  assert.ok(open.indexOf("read_at") > -1 && open.indexOf("read_at") < open.indexOf("redirect("), "marks read first");
  assert.match(readFileSync("app/account/inbox/page.tsx", "utf8"), /action=\{openMessage\}/);
});
