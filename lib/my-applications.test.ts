// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { readMyApplicationEvents, readMyApplications, type MineDb } from "./my-applications.ts";

// A stand in for the database that records which source each read used. `migrated` false copies a database before migration 0040, where
// the 2 functions do not exist yet.
function fakeDb(migrated: boolean) {
  const used: string[] = [];
  const chain = (result: unknown) => {
    const c: any = { select: () => c, eq: () => c, order: () => c, maybeSingle: () => c, then: (a: any, b: any) => Promise.resolve(result).then(a, b) };
    return c;
  };
  const db: MineDb = {
    rpc(name: string) {
      used.push(`rpc:${name}`);
      return chain(migrated ? { data: [{ id: "a1", status: "viewed" }], error: null } : { data: null, error: { code: "PGRST202", message: "Could not find the function" } });
    },
    from(table: string) {
      used.push(`table:${table}`);
      // After the migration a candidate's direct read returns nothing. Before it, the real row.
      return chain({ data: migrated ? [] : [{ id: "a1", status: "shortlisted" }], error: null });
    },
  };
  return { db, used };
}

test("after migration 0040 a candidate's applications come from the masked copy, and the table is not touched", async () => {
  const { db, used } = fakeDb(true);
  const { data } = await readMyApplications<{ id: string; status: string }[]>(db, (q) => q.select("id, status"));
  assert.deepEqual(data, [{ id: "a1", status: "viewed" }]);
  assert.deepEqual(used, ["rpc:my_applications"]);
});

test("before migration 0040 the read falls back to the table, so the site works as it does today", async () => {
  const { db, used } = fakeDb(false);
  const { data } = await readMyApplications<{ id: string; status: string }[]>(db, (q) => q.select("id, status"));
  assert.equal(data?.length, 1);
  assert.deepEqual(used, ["rpc:my_applications", "table:applications"]);
});

test("the history does the same", async () => {
  const after = fakeDb(true);
  await readMyApplicationEvents(after.db, "a1");
  assert.deepEqual(after.used, ["rpc:my_application_events"]);
  const before = fakeDb(false);
  assert.equal((await readMyApplicationEvents(before.db, "a1")).length, 1);
  assert.deepEqual(before.used, ["rpc:my_application_events", "table:application_events"]);
});

test("no candidate page reads the applications tables with the person's own sign in except through these helpers", () => {
  // The clinic's pages read applications to their own jobs directly, which the database still allows. A candidate's direct read returns
  // nothing since migration 0040, so a new candidate page that did it would show an empty list.
  for (const file of ["lib/application-loaders.ts", "lib/recommendations.ts", "app/jobs/[id]/apply/page.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /readMyApplications/, `${file} must read a candidate's applications with readMyApplications`);
    const direct = [...source.matchAll(/\.from\("(applications|application_events)"\)/g)];
    const allowed = file === "lib/application-loaders.ts" ? 2 : 0; // the clinic's branch of loadApplication
    assert.equal(direct.length, allowed, `${file} reads the applications tables directly ${direct.length} times, expected ${allowed}`);
  }
  // Whatever the source, the candidate's copy still goes through the mask in lib/application-view.ts.
  const loaders = readFileSync("lib/application-loaders.ts", "utf8");
  assert.match(loaders, /\.map\(viewForCandidate\)/);
  assert.match(loaders, /viewApplication\(/);
  // lib/candidate.ts only hands the signed in connection to those loaders and reads the 2 tables nowhere itself.
  const candidate = readFileSync("lib/candidate.ts", "utf8");
  assert.equal([...candidate.matchAll(/\.from\("(applications|application_events)"\)/g)].length, 0);
  assert.match(candidate, /loadApplicationWith\(/);
  assert.match(candidate, /loadMyApplications\(/);
});
