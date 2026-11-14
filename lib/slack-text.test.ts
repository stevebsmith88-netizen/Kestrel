// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { digestMessage, formatAlert, isSlackWebhook, siteLabel, slackEscape } from "./slack-text.ts";

test("the label says which copy of the site sent it", () => {
  assert.equal(siteLabel({ DEMO_MODE: "yes", VERCEL_ENV: "production" }), "demo");
  assert.equal(siteLabel({ VERCEL_ENV: "production" }), "live");
  assert.equal(siteLabel({ VERCEL_ENV: "preview" }), "preview");
  assert.equal(siteLabel({}), "local");
});

test("text from a person cannot break Slack's markup", () => {
  assert.equal(slackEscape("Smith & <b>Sons</b>"), "Smith &amp; &lt;b&gt;Sons&lt;/b&gt;");
  assert.equal(formatAlert("live", "A job is waiting <now>", ["Eye Care & Co", "", "Guelph, Ontario"]), "*[live] A job is waiting &lt;now&gt;*\nEye Care &amp; Co\nGuelph, Ontario");
});

test("only a real Slack incoming webhook address is accepted", () => {
  assert.equal(isSlackWebhook("https://hooks.slack.com/services/T000/B000/abcDEF123"), true);
  assert.equal(isSlackWebhook("https://evil.example/services/T000/B000/abc"), false);
  assert.equal(isSlackWebhook("http://hooks.slack.com/services/T000/B000/abc"), false);
  assert.equal(isSlackWebhook(" https://hooks.slack.com/services/T000/B000/abc"), false);
  assert.equal(isSlackWebhook(undefined), false);
  assert.equal(isSlackWebhook(""), false);
});

test("the daily summary reads in plain numbers with the right singular and plural", () => {
  const text = digestMessage("live", { liveJobs: 1, waitingForReview: 2, openReports: 0, newClinics: 1, newCandidates: 3, newApplications: 0, newWaitlist: 5, paymentsToday: 1, paidTodayCents: 9900, paidTotalCents: 17800 });
  assert.match(text, /^\*\[live\] Daily summary\*/);
  assert.match(text, /1 new clinic account, 3 new candidate accounts, 0 applications, 5 waitlist sign ups/);
  assert.match(text, /1 payment taken, \$99 before HST\. \$178 in total\./);
  assert.match(text, /Now: 1 live job, 2 waiting for review, 0 open reports\./);
});

test("the admin check explains a missing or mistyped setting and never shows the address", async () => {
  const { slackStatus } = await import("./slack-text.ts");
  assert.equal(slackStatus(undefined).ok, false);
  assert.equal(slackStatus(" https://hooks.slack.com/services/T0/B0/abc").ok, false);
  assert.equal(slackStatus("https://example.com/x").ok, false);
  const good = slackStatus("https://hooks.slack.com/services/T0/B0/SECRETSECRET");
  assert.equal(good.ok, true);
  assert.ok(!JSON.stringify(good).includes("SECRETSECRET"));
});
