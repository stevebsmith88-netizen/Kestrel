// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { candidateExtras, type ExportDb } from "./data-export.ts";

// A small stand in for the database. `broken` lists tables or columns that fail, as they would before a migration is run.
function fakeDb(rows: Record<string, unknown>, broken: string[] = []): ExportDb {
  return {
    from(table: string) {
      return {
        select(columns: string) {
          const fail = broken.some((b) => table === b || columns.split(",").map((c) => c.trim()).includes(b));
          const result = fail ? { data: null, error: { message: "column does not exist" } } : { data: rows[`${table}:${columns}`] ?? rows[table] ?? null, error: null };
          const chain: any = {
            eq: () => chain,
            in: () => chain,
            order: () => chain,
            maybeSingle: () => Promise.resolve(result),
            then: (a: any, b: any) => Promise.resolve(result).then(a, b),
          };
          return chain;
        },
      };
    },
  };
}

const rows = {
  "candidate_profiles:home_city, home_province, pref_radius_km, pref_provinces, pref_employment_types, pref_other_roles, pref_min_pay, pref_pay_period, pref_practice": {
    home_city: "Guelph", home_province: "Ontario", pref_radius_km: 25, pref_provinces: ["Ontario"], pref_employment_types: ["full_time"],
    pref_other_roles: ["optometric_assistant"], pref_min_pay: 28, pref_pay_period: "hour", pref_practice: "independent",
  },
  "candidate_profiles:career_stage": { career_stage: "studying" },
  "profiles:name_changed_at": { name_changed_at: "2026-11-01T10:00:00Z" },
  "candidate_job_hides": [{ job_id: "j1", created_at: "2026-11-02T10:00:00Z" }],
  "jobs": [{ id: "j1", title: "Optician", clinic_name: null }],
};

test("the download includes every private preference, the career stage, hidden jobs and the name change date", async () => {
  const x = await candidateExtras(fakeDb(rows), "u1");
  assert.equal((x.preferences as any).home_city, "Guelph");
  assert.equal((x.preferences as any).pref_min_pay, 28);
  assert.equal((x.preferences as any).pref_pay_period, "hour");
  assert.equal((x.preferences as any).pref_practice, "independent");
  assert.deepEqual((x.preferences as any).pref_other_roles, ["optometric_assistant"]);
  assert.equal(x.careerStage, "studying");
  assert.equal(x.nameLastChangedAt, "2026-11-01T10:00:00Z");
  assert.equal((x.jobsMarkedNotInterested as any[]).length, 1);
  assert.equal((x.jobsMarkedNotInterested as any[])[0].job_title, "Optician");
});

test("a database without migrations 0031, 0037 or 0039 still gives a download", async () => {
  const x = await candidateExtras(fakeDb(rows, ["career_stage", "name_changed_at", "candidate_job_hides", "pref_min_pay"]), "u1");
  assert.equal(x.careerStage, null);
  assert.equal(x.nameLastChangedAt, null);
  assert.deepEqual(x.jobsMarkedNotInterested, []);
  assert.equal(x.preferences, null);
});

test("the download route uses the helper and still keeps the shortlist hidden", () => {
  const src = readFileSync(new URL("../app/account/export/route.ts", import.meta.url), "utf8");
  assert.match(src, /candidateExtras\(/);
  assert.match(src, /candidateStatus\(a\.status\)/);
  assert.match(src, /a\.status === "shortlisted" \? null/);
});
