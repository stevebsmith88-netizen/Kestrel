// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { alertHeading, alertSubject, followedLine } from "./follows.ts";

test("the daily email's heading says why it was sent", () => {
  assert.equal(alertHeading(1, 0), "A new job matches your alert");
  assert.equal(alertHeading(3, 0), "3 new jobs match your alerts");
  assert.equal(alertHeading(1, 1), "A clinic you follow has posted a job");
  assert.equal(alertHeading(2, 2), "2 new jobs from places you follow");
  assert.equal(alertHeading(3, 1), "3 new jobs for you");
  assert.equal(alertHeading(0, 0), "");
});

test("the subject keeps the old wording for plain alerts", () => {
  assert.equal(alertSubject(1, 0), "New job alert: 1 new job");
  assert.equal(alertSubject(4, 0), "New job alert: 4 new jobs");
  assert.equal(alertSubject(1, 1), "A clinic you follow posted a job");
  assert.equal(alertSubject(3, 3), "3 new jobs from places you follow");
  assert.equal(alertSubject(5, 2), "New job alert: 5 new jobs");
});

test("a followed job's line says why", () => {
  assert.equal(followedLine("Optician, Brightview, Guelph, $55,000 a year"), "From a place you follow: Optician, Brightview, Guelph, $55,000 a year");
});

test("the daily job folds follows into the same email, claims them with the alerts, and puts them back if the email fails", async () => {
  const { readFileSync } = await import("node:fs");
  const cron = readFileSync(new URL("../app/api/cron/daily/route.ts", import.meta.url), "utf8");
  assert.match(cron, /from\("employer_follows"\)\.select\("user_id, employer_id, last_sent_at"\)/);
  assert.match(cron, /alertSubject\(found\.size, followedFound\.size\)/);
  assert.match(cron, /from\("employer_follows"\)\.update\(\{ last_sent_at: stamp \}\)/);
  assert.match(cron, /from\("employer_follows"\)\.update\(\{ last_sent_at: f\.last_sent_at \}\)/);
  assert.equal((cron.match(/deliverEmail\(\{ to: email, subject: alertSubject/g) ?? []).length, 1, "1 email a day per person, for alerts and follows together");
});

test("the follow endpoint takes only JSON from this website, and a follow needs a public page", async () => {
  const { readFileSync } = await import("node:fs");
  const route = readFileSync(new URL("../app/api/follow/route.ts", import.meta.url), "utf8");
  assert.match(route, /application\/json/);
  assert.match(route, /origin/);
  const server = readFileSync(new URL("./follow-server.ts", import.meta.url), "utf8");
  assert.match(server, /listPublicClinics\(\)/);
  assert.match(server, /session\.role !== "candidate"/);
});
