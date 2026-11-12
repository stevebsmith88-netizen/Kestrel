// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { MAINTENANCE_HTML, maintenanceApiResponse, maintenanceOn } from "./maintenance.ts";

test("the switch is on only when MAINTENANCE_MODE is yes", () => {
  assert.equal(maintenanceOn({ MAINTENANCE_MODE: "yes" }), true);
  assert.equal(maintenanceOn({ MAINTENANCE_MODE: " YES " }), true);
  assert.equal(maintenanceOn({ MAINTENANCE_MODE: "no" }), false);
  assert.equal(maintenanceOn({ MAINTENANCE_MODE: "" }), false);
  assert.equal(maintenanceOn({}), false);
});

test("the back soon page is plain and does not use dashes as punctuation", () => {
  assert.ok(!/—|–/.test(MAINTENANCE_HTML));
  assert.match(MAINTENANCE_HTML, /The Kestrel team/);
});

// P1-22: the API routes that write or send email stop too. The bounce webhook and the health check keep working.
test("while the switch is on, the API answer is a 503 that says to try later", async () => {
  const answer = maintenanceApiResponse({ MAINTENANCE_MODE: "yes" });
  assert.ok(answer);
  assert.equal(answer.status, 503);
  assert.equal(answer.headers.get("Retry-After"), "3600");
  const body = await answer.json();
  assert.match(body.error, /try again/);
  assert.ok(!/—|–/.test(body.error));
  assert.equal(maintenanceApiResponse({ MAINTENANCE_MODE: "no" }), null);
  assert.equal(maintenanceApiResponse({}), null);
});

test("the waitlist, the daily job and the view counter stop first thing; the Resend webhook and the health check do not", () => {
  const read = (path: string) => readFileSync(new URL(`../app/api/${path}/route.ts`, import.meta.url), "utf8");
  for (const [path, handler] of [["waitlist", "POST"], ["cron/daily", "GET"], ["job-event", "POST"]]) {
    const source = read(path);
    const body = source.slice(source.indexOf(`export async function ${handler}(`));
    const firstLine = body.split("\n")[1].trim();
    assert.match(firstLine, /^const stopped = maintenanceApiResponse\(\);$/, `${path} checks the switch on its first line`);
  }
  for (const path of ["resend", "health"]) assert.doesNotMatch(read(path), /maintenanceApiResponse/, `${path} keeps working`);
});
