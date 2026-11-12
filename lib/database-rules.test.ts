// Run with: npm test
// The rules the website applies to a job must also be held by the database, so a job sent straight to the database API cannot skip them
// (audit P1-28 and P1-44). The database side is tested for real by scripts/dev/rls-tests.sh. These tests keep the 2 sides in step.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
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
  const approve = action("lib/admin-actions.ts", "export async function approveJob");
  assert.ok(approve.indexOf("isQuebecJob(") > 0 && approve.indexOf("isQuebecJob(") < approve.indexOf('status: "live"'), "approveJob must check for Quebec before it makes the job live");
  const extend = action("lib/clinic-actions.ts", "async function doExtend");
  assert.ok(extend.indexOf("isQuebecJob(") > 0 && extend.indexOf("isQuebecJob(") < extend.indexOf('status: "live"'), "doExtend must check for Quebec before it extends the job");
});
