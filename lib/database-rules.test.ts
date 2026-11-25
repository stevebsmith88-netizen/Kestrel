// Run with: npm test
// The rules the website applies to a job must also be held by the database, so a job sent straight to the database API cannot skip them
// (audit P1-28 and P1-44). The database side is tested for real by scripts/dev/rls-tests.sh. These tests keep the 2 sides in step.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { OPTOMETRIST_ONLY_PERIODS, OPTOMETRIST_ROLE } from "./job-pay.ts";
import { QUEBEC, isQuebecJob } from "./jobs.ts";

// The newest definition of a named rule in the migrations.
function latestRule(name: string): string {
  let found = "";
  for (const file of readdirSync("supabase/migrations").sort()) {
    const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
    const m = sql.match(new RegExp(`add constraint ${name} check \\(([\\s\\S]*?)\\)( not valid)?;`));
    if (m) found = m[1];
  }
  return found;
}

function action(file: string, start: string): string {
  const source = readFileSync(file, "utf8");
  const from = source.indexOf(start);
  assert.ok(from >= 0, `${start} was not found in ${file}`);
  const next = source.indexOf("\nexport ", from + start.length);
  return source.slice(from, next === -1 ? undefined : next);
}

test("P1-28: a Quebec job is spotted whatever the capitals or accent", () => {
  assert.equal(isQuebecJob({ province: QUEBEC }), true);
  assert.equal(isQuebecJob({ province: "quebec " }), true);
  assert.equal(isQuebecJob({ province: "Québec" }), true);
  assert.equal(isQuebecJob({ province: "Ontario" }), false);
  assert.equal(isQuebecJob({ province: null }), false);
});

test("P1-28: the database refuses a Quebec job that is in review or live", () => {
  const rule = latestRule("jobs_not_quebec_once_sent");
  assert.ok(rule, "the rule jobs_not_quebec_once_sent was not found in the migrations");
  assert.match(rule, /'in_review', 'live'/);
  assert.ok(rule.includes(`'${QUEBEC.toLowerCase()}'`), "the rule must name Quebec the way the website spells it");
});

test("P1-28: approving and extending both re-check the province", () => {
  const approve = action("lib/job-approval.ts", "export async function approveJobNow");
  assert.ok(approve.indexOf("isQuebecJob(") > 0 && approve.indexOf("isQuebecJob(") < approve.indexOf('status: "live"'), "approveJobNow (behind the approve buttons and the automatic approval) must check for Quebec before it makes the job live");
  const extend = action("lib/clinic-actions.ts", "async function doExtend");
  assert.ok(extend.indexOf("isQuebecJob(") > 0 && extend.indexOf("isQuebecJob(") < extend.indexOf('status: "live"'), "doExtend must check for Quebec before it extends the job");
});

test("P1-44: the database keeps percentages and the optometrist only pay periods for optometrist roles", () => {
  const rule = latestRule("jobs_optometrist_only_pay");
  assert.ok(rule, "the rule jobs_optometrist_only_pay was not found in the migrations");
  assert.ok(rule.includes(`role_category = '${OPTOMETRIST_ROLE}'`));
  const periods = [...(rule.match(/pay_period <> all \(array\[([^\]]*)\]\)/)?.[1] ?? "").matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual(periods.sort(), [...OPTOMETRIST_ONLY_PERIODS].sort(), "the periods in the database rule must match OPTOMETRIST_ONLY_PERIODS in lib/job-pay.ts");
  assert.match(rule, /pay_percent_min is null and pay_percent_max is null/);
});

test("P1-57: a field based job based outside Quebec may cover an area that includes Quebec (Steve, 12th November 2026)", () => {
  // Only the province the job is based in is checked, by the form, by approve and extend, and by the database rule.
  assert.equal(isQuebecJob({ province: "Ontario", territory: "Eastern Ontario and western Quebec" } as { province: string }), false);
  assert.doesNotMatch(latestRule("jobs_not_quebec_once_sent"), /territory/);
});
