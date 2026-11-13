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
  // A read wrapped in withExpected (lib/expected-columns.ts) also asks for the 3 expected earnings columns once the database has them.
  const EXPECTED = ["pay_expected_min", "pay_expected_max", "pay_expected_period"];
  for (const m of source.matchAll(/from\("jobs"\)\s*\.select\(\s*(await\s+withExpected\(\s*)?(?:"([^"]*)"|([A-Z_]+)|([a-z][A-Za-z]*))/g)) {
    const text = m[2] ?? constants.get(m[3] ?? "") ?? "";
    out.push([...text.replace(/[a-z_!]+\([^)]*\)/g, "").split(",").map((c) => c.trim()).filter(Boolean), ...(m[1] ? EXPECTED : [])]);
  }
  // The search builds its query from a variable that holds withExpected(SUMMARY_COLUMNS).
  if (/summaryColumns = await withExpected\(SUMMARY_COLUMNS\)/.test(source)) {
    out.push([...(constants.get("SUMMARY_COLUMNS") ?? "").replace(/[a-z_!]+\([^)]*\)/g, "").split(",").map((c) => c.trim()).filter(Boolean), ...EXPECTED]);
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

// ---------------------------------------------------------------- audit P1-41
// Signed in people used to get every column of any live job and of any clinic with a live job, because the "anyone can read" rules covered
// them too and their permission is table wide. Since migration 0040 those 2 rules are for visitors only. A signed in person reads jobs and
// clinics through their own sign in only as the owner (or an admin), and every public page reads through the visitor client with the public
// column list. The database side is tested for real by scripts/dev/rls-tests.sh.

function grantedColumns(table: string): Set<string> {
  const granted = new Set<string>();
  for (const file of readdirSync("supabase/migrations")) {
    const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
    for (const m of sql.matchAll(new RegExp(`grant\\s+select\\s*\\(([^)]*)\\)\\s+on\\s+public\\.${table}\\s+to\\s+anon`, "gi"))) {
      m[1].split(",").map((c) => c.trim()).filter(Boolean).forEach((c) => granted.add(c));
    }
  }
  return granted;
}

// Who the newest version of a named rule applies to.
function policyRoles(name: string): string {
  let roles = "";
  for (const file of readdirSync("supabase/migrations").sort()) {
    const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
    const m = sql.match(new RegExp(`create policy "${name}"\\s+on public\\.\\w+ for select to ([a-z_, ]+?)\\s+using`));
    if (m) roles = m[1].trim();
  }
  return roles;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(`${dir}/${e.name}`) : /\.(ts|tsx)$/.test(e.name) && !e.name.endsWith(".test.ts") ? [`${dir}/${e.name}`] : []);
}

test("every clinic column a public page reads is one the public role is allowed to read", () => {
  const granted = grantedColumns("employers");
  assert.ok(granted.has("clinic_name") && granted.has("claimed"), "the grants were not found in the migrations");
  const source = readFileSync("lib/public-jobs.ts", "utf8");
  const embeds = [...source.matchAll(/employers!?[a-z]*\(([^)]*)\)/g)];
  assert.ok(embeds.length >= 1, "the public clinic reads were not found");
  for (const m of embeds) {
    for (const column of m[1].split(",").map((c) => c.trim()).filter(Boolean)) {
      assert.ok(granted.has(column), `lib/public-jobs.ts reads employers.${column}, which the public role cannot read`);
    }
  }
});

test("the 'anyone can read' rules for live jobs and their clinics are for visitors only, so a sign in gives no wider view", () => {
  assert.equal(policyRoles("Anyone can read live jobs"), "anon");
  assert.equal(policyRoles("Anyone can read clinics that have live jobs"), "anon");
});

test("only the clinic's own pages read jobs or clinics with a person's own sign in", () => {
  // These read the signed in clinic's own records, which the owner rules still allow in full. Any other page must use supabasePublic() for
  // live jobs (public columns) or the server key after its own check. Add a file here only for reads of the reader's own jobs or clinic.
  const OWN_RECORDS = new Set(["lib/clinic.ts", "lib/clinic-actions.ts", "lib/applicant-actions.ts", "lib/template-actions.ts"]);
  const found = new Set<string>();
  for (const file of [...sourceFiles("lib"), ...sourceFiles("app"), ...sourceFiles("components")]) {
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(/\b(\w+)\s*\.from\("(?:jobs|employers)"\)/g)) {
      // The nearest earlier line that gives this variable a database client says which kind it is.
      const before = source.slice(0, m.index);
      const made = [...before.matchAll(new RegExp(`\\b${m[1]}\\b[^;\\n]*=[^;\\n]*\\b(supabaseServer|supabaseAdmin|supabasePublic)\\(`, "g"))].pop();
      if (made?.[1] === "supabaseServer") found.add(file);
    }
  }
  assert.ok(found.size >= 3, "the signed in reads were not found");
  for (const file of found) assert.ok(OWN_RECORDS.has(file), `${file} reads jobs or employers with the person's own sign in. Since migration 0040 that returns only their own records.`);
});
