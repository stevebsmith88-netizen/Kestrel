// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

// The public (anonymous) database role may read only the job columns named in the grants. A page that asks for any other column fails with
// "permission denied for table jobs", which shows up as an empty list or a stale sitemap and nothing louder. The sitemap once asked for
// updated_at this way. This test reads the grants from the migrations and checks every public read of jobs against them.
function grantedJobColumns(): Set<string> {
  const granted = new Set<string>();
  for (const file of readdirSync("supabase/migrations")) {
    const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
    for (const m of sql.matchAll(/grant\s+select\s*\(([^)]*)\)\s+on\s+public\.jobs\s+to\s+anon/gi)) {
      m[1].split(",").map((c) => c.trim()).filter(Boolean).forEach((c) => granted.add(c));
    }
  }
  return granted;
}

// The top level columns of each .from("jobs").select(...) in the public queries, leaving out embedded tables such as employers(...).
function publicJobSelects(source: string): string[][] {
  const constants = new Map<string, string>();
  for (const m of source.matchAll(/const\s+([A-Z_]+)\s*=\s*"([^"]*)"/g)) constants.set(m[1], m[2]);
  const out: string[][] = [];
  for (const m of source.matchAll(/from\("jobs"\)\s*\.select\(\s*(?:"([^"]*)"|([A-Z_]+))/g)) {
    const text = m[1] ?? constants.get(m[2]) ?? "";
    out.push(text.replace(/[a-z_!]+\([^)]*\)/g, "").split(",").map((c) => c.trim()).filter(Boolean));
  }
  return out;
}

test("every job column a public page reads is one the public role is allowed to read", () => {
  const granted = grantedJobColumns();
  assert.ok(granted.has("title") && granted.has("posted_at"), "the grants were not found in the migrations");
  const selects = publicJobSelects(readFileSync("lib/public-jobs.ts", "utf8"));
  assert.ok(selects.length >= 5, "the public job reads were not found");
  for (const columns of selects) {
    for (const column of columns) assert.ok(granted.has(column), `lib/public-jobs.ts reads jobs.${column}, which the public role cannot read`);
  }
});
