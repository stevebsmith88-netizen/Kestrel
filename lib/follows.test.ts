// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { alertHeading, alertSubject, closingLine, followedLine } from "./follows.ts";

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
  assert.match(cron, /alertSubject\(found\.size \+ closingFound\.size, followedFound\.size, closingFound\.size\)/);
  assert.match(cron, /from\("employer_follows"\)\.update\(\{ last_sent_at: stamp \}\)/);
  assert.match(cron, /from\("employer_follows"\)\.update\(\{ last_sent_at: f\.last_sent_at \}\)/);
  assert.equal((cron.match(/deliverEmail\(\{ to: email, subject: alertSubject/g) ?? []).length, 1, "1 email a day per person, for alerts, follows and closing saved jobs together");
  assert.match(cron, /from\("saved_jobs"\)\.update\(\{ reminded_at: stamp \}\)/, "each saved job is claimed before the email");
  assert.match(cron, /from\("saved_jobs"\)\.update\(\{ reminded_at: null \}\)/, "and put back if the email fails");
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

test("saved jobs about to close change the heading and subject, and a mix says jobs for you", () => {
  assert.equal(alertHeading(1, 0, 1), "A job you saved is closing soon");
  assert.equal(alertHeading(3, 0, 3), "3 saved jobs are closing soon");
  assert.equal(alertHeading(4, 1, 2), "4 jobs for you");
  assert.equal(alertSubject(1, 0, 1), "A saved job is closing soon");
  assert.equal(alertSubject(2, 0, 2), "2 saved jobs are closing soon");
  assert.equal(alertSubject(4, 0, 1), "Job update: 4 jobs for you");
  assert.equal(closingLine("Optician, Brightview, Guelph, $55,000 a year"), "Closing soon, saved by you: Optician, Brightview, Guelph, $55,000 a year");
});
