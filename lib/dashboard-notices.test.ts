// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DASHBOARD_NOTICES, noticeTone } from "./dashboard-notices.ts";

test("every message a dashboard button can show exists, and none uses a dash as punctuation", () => {
  for (const key of ["job-closed", "job-withdrawn", "job-deleted", "job-delete-blocked", "job-extended", "job-extend-blocked", "job-extend-failed", "template-saved", "template-limit", "template-failed"]) {
    assert.ok(DASHBOARD_NOTICES[key], key);
  }
  for (const [key, text] of Object.entries(DASHBOARD_NOTICES)) {
    assert.ok(!/[—–]/.test(text), `${key} has a long dash`);
    assert.ok(!/[‘’“”]/.test(text), `${key} has curly quotes`);
  }
});

test("a message that says something did not happen is the yellow style, the rest are green", () => {
  for (const key of ["job-delete-blocked", "job-extend-blocked", "job-extend-failed", "template-limit", "template-failed", "job-limit", "job-repost-failed"]) {
    assert.equal(noticeTone(key), "warn", key);
  }
  for (const key of ["job-closed", "job-deleted", "job-extended", "job-withdrawn", "template-saved", "job-submitted"]) {
    assert.equal(noticeTone(key), "ok", key);
  }
});

test("the dashboard buttons save in place, so they use the quiet actions and not the ones that reload the page", () => {
  const page = readFileSync(new URL("../app/clinic/page.tsx", import.meta.url), "utf8");
  for (const name of ["closeJobQuiet", "deleteJobQuiet", "extendJobQuiet", "withdrawJobQuiet", "saveJobAsTemplateQuiet", "dismissNoticesQuiet"]) {
    assert.ok(page.includes(`action={${name}}`), `${name} is used on the dashboard`);
  }
  for (const name of ["closeJob", "deleteJob", "extendJob", "withdrawJob", "saveJobAsTemplate", "dismissNotices"]) {
    assert.ok(!new RegExp(`action=\\{${name}\\}`).test(page), `${name} would reload the page`);
  }
  assert.ok(page.includes("<ToastHost />"), "the message host is on the page");
});

test("the applicants page bulk buttons save in place too", () => {
  const page = readFileSync(new URL("../app/clinic/jobs/[id]/applicants/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes("shortlist={shortlistSelectedQuiet}") && page.includes("interview={interviewSelectedQuiet}") && page.includes("decline={declineSelectedQuiet}"));
  assert.ok(page.includes("<ToastHost />"), "the message host is on the page");
});
