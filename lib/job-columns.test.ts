// Run with: npm test
// A column that is missing from the database permission lists silently fails to save. This checks that every column the job form writes
// (and every new column that is shown publicly) is granted in the migration, so none is forgotten.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { jobFromForm } from "./job-form.ts";

const migrations = ["0005_clinics_and_jobs", "0013_field_roles", "0034_pay_basis_tags_headcount"].map((n) => readFileSync(new URL(`../supabase/migrations/${n}.sql`, import.meta.url), "utf8")).join("\n");

// The column names listed in every `grant <verb> (a, b, c) on public.jobs to <role>` statement.
function granted(verb: string, role: string, table = "jobs") {
  const out = new Set<string>();
  const re = new RegExp(`grant\\s+${verb}\\s*\\(([^)]*)\\)\\s+on\\s+public\\.${table}\\s+to\\s+${role}`, "gi");
  for (const m of migrations.matchAll(re)) m[1].split(",").map((c) => c.trim()).filter(Boolean).forEach((c) => out.add(c));
  return out;
}

test("every column the job form writes can be inserted and updated by a signed in clinic", () => {
  const form = new FormData();
  form.set("title", "Optometrist");
  const { row } = jobFromForm(form, false);
  const insert = granted("insert", "authenticated");
  const update = granted("update", "authenticated");
  for (const column of Object.keys(row)) {
    assert.ok(insert.has(column), `insert permission missing for jobs.${column}`);
    assert.ok(update.has(column), `update permission missing for jobs.${column}`);
  }
});

test("the new pay and tag columns can be read on a public job page, and the employee band is not public", () => {
  const read = granted("select", "anon");
  for (const c of ["pay_is_minimum", "pay_percent_min", "pay_percent_max", "pay_percent_of", "tags_software", "tags_equipment", "tags_specialties"]) {
    assert.ok(read.has(c), `public read missing for jobs.${c}`);
  }
  assert.equal(/grant\s+select[^;]*employee_band[^;]*to\s+anon/i.test(migrations), false);
  assert.equal(granted("select", "anon", "employers").has("employee_band"), false);
});

test("templates can save the new pay and tag columns", () => {
  const t = readFileSync(new URL("../supabase/migrations/0034_pay_basis_tags_headcount.sql", import.meta.url), "utf8");
  for (const verb of ["insert", "update"]) {
    const re = new RegExp(`grant\\s+${verb}\\s*\\(([^)]*)\\)\\s+on\\s+public\\.job_templates`, "i");
    const cols = (t.match(re)?.[1] ?? "").split(",").map((c) => c.trim());
    for (const c of ["pay_is_minimum", "pay_percent_min", "pay_percent_max", "pay_percent_of", "tags_software", "tags_equipment", "tags_specialties"]) assert.ok(cols.includes(c), `${verb} on job_templates.${c}`);
  }
});

test("the combined file holds migration 0034 word for word", () => {
  const combined = readFileSync(new URL("../supabase/combined/run-everything.sql", import.meta.url), "utf8");
  const mig = readFileSync(new URL("../supabase/migrations/0034_pay_basis_tags_headcount.sql", import.meta.url), "utf8");
  assert.ok(combined.includes(mig));
});
