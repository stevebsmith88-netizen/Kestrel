// Run with: npm test
// The clinic's applicants list (review item X-16), against a stand in database that answers the way Supabase does.
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadApplicants } from "./applicant-list.ts";

const row = (id: string, status: string, created_at: string, name?: string) => ({ id, job_id: "j1", status, created_at, cover_letter: null, clinic_name: "Harbourside Optical", applicant: name === undefined ? null : { name } });
const ROWS = [
  row("a1", "applied", "2026-11-01T10:00:00Z", "Sam"),
  row("a2", "interview", "2026-11-03T10:00:00Z", "  Priya "),
  row("a3", "offer", "2026-11-02T10:00:00Z", ""),
  row("a4", "not_selected", "2026-11-04T10:00:00Z", "Lee"),
  row("a5", "shortlisted", "2026-11-05T10:00:00Z"),
  { ...row("x1", "applied", "2026-11-06T10:00:00Z", "Other job"), job_id: "j2" },
];

function fakeDb(rows = ROWS) {
  const asked: string[] = [];
  return {
    asked,
    db: {
      from(table: string) {
        asked.push(table);
        let list: any[] = [...rows];
        const q: any = {
          select: () => q,
          eq: (col: string, v: string) => { list = list.filter((r) => r[col] === v); return q; },
          order: (col: string, o: { ascending: boolean }) => {
            list.sort((x, y) => String(x[col]).localeCompare(String(y[col])) * (o.ascending ? 1 : -1));
            return Promise.resolve({ data: list, error: null });
          },
        };
        return q;
      },
    },
  };
}

test("reads only this job's applications, newest first", async () => {
  const { db, asked } = fakeDb();
  const r = await loadApplicants(db, "j1");
  assert.deepEqual(asked, ["applications"]);
  assert.deepEqual(r.rows.map((x) => x.id), ["a5", "a4", "a2", "a3", "a1"]);
  assert.equal(r.clinicName, "Harbourside Optical");
});

test("tabs, counts and the waiting count", async () => {
  const { db } = fakeDb();
  const r = await loadApplicants(db, "j1", "interview");
  assert.equal(r.active, "interview");
  assert.deepEqual(r.shown.map((x) => x.id), ["a2"]);
  assert.equal(r.count("all"), 5);
  assert.equal(r.count("closed"), 1);
  assert.equal(r.waiting.length, 2);
  assert.equal(r.anyTick, false, "nobody at interview can be ticked");
  assert.equal((await loadApplicants(db, "j1", "nonsense")).active, "all", "an unknown tab shows everyone");
});

test("the role filled form lists the right people, with a name for everyone", async () => {
  const { db } = fakeDb();
  const r = await loadApplicants(db, "j1");
  assert.deepEqual(r.hireCandidates.map((x) => x.id).sort(), ["a1", "a2", "a3", "a5"]);
  assert.deepEqual(r.talking.map((x) => [x.id, x.name]), [["a2", "Priya"], ["a3", "Applicant"]]);
  assert.equal(r.rows.find((x) => x.id === "a5")?.applicant.name, undefined, "a missing applicant block does not break the page");
});

test("no database: an empty list, not an error", async () => {
  const r = await loadApplicants(null, "j1");
  assert.equal(r.rows.length, 0);
  assert.equal(r.clinicName, "");
});
