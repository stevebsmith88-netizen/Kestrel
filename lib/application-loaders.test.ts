// Run with: npm test
// The loaders behind the clinic's and the candidate's application pages (audit P1-19). A stand in database holds 1 shortlisted application,
// answers the way the real one does (including the masked copy since migration 0040), and the tests check what each reader is shown.
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadApplicationWith, loadMyApplications } from "./application-loaders.ts";
import type { MineDb } from "./my-applications.ts";

const app = (over: Record<string, unknown> = {}) => ({
  id: "a1", job_id: "j1", status: "shortlisted", cover_letter: "Hello", keep_details: true, job_title: "Optician", clinic_name: "Harbourside Optical",
  job_location: "Toronto, Ontario", cv_filename: null, clinic_message: "internal note", viewed_at: "2026-11-02T10:00:00Z", status_changed_at: "2026-11-05T09:30:00Z",
  created_at: "2026-11-01T10:00:00Z", applicant: { name: "Sam" }, ...over,
});
const events = [
  { application_id: "a1", status: "applied", note: null, created_at: "2026-11-01T10:00:00Z" },
  { application_id: "a1", status: "viewed", note: null, created_at: "2026-11-02T10:00:00Z" },
  { application_id: "a1", status: "shortlisted", note: null, created_at: "2026-11-05T09:30:00Z" },
];

// `migrated`: since migration 0040 a candidate reads through 2 functions that show a shortlist as viewed, and the tables answer nothing.
// `reader`: a clinic reads the tables, and the database returns only its own applications (`owns`).
function fakeDb(opts: { rows?: ReturnType<typeof app>[]; migrated?: boolean; reader: "candidate" | "clinic"; owns?: boolean }): { db: MineDb; calls: string[] } {
  const rows = opts.rows ?? [app()];
  const calls: string[] = [];
  const builder = (table: string, source: () => any[], failing = false) => {
    let list = source();
    const q: any = {
      select: () => q,
      eq: (col: string, value: string) => { list = list.filter((r) => r[col] === value); return q; },
      order: (col: string, o?: { ascending?: boolean }) => {
        list = [...list].sort((x, y) => String(x[col]).localeCompare(String(y[col])) * (o?.ascending === false ? -1 : 1));
        return q;
      },
      maybeSingle: () => { list = list.slice(0, 1); q.single = true; return q; },
      then: (ok: any, bad: any) => {
        const result = failing ? { data: null, error: { code: "PGRST202", message: "missing" } } : { data: q.single ? (list[0] ?? null) : list, error: null };
        return Promise.resolve(result).then(ok, bad);
      },
    };
    calls.push(table);
    return q;
  };
  const masked = (r: any) => (r.status === "shortlisted" ? { ...r, status: "viewed", clinic_message: null } : r);
  const db: MineDb = {
    rpc(name: string, args?: Record<string, unknown>) {
      if (!opts.migrated) return builder(`rpc:${name}`, () => [], true);
      if (name === "my_applications") return builder(`rpc:${name}`, () => rows.map(masked));
      return builder(`rpc:${name}`, () => events.filter((e) => e.application_id === args?.application).map((e) => ({ ...e, status: e.status === "shortlisted" ? "viewed" : e.status })));
    },
    from(table: string) {
      if (opts.reader === "candidate" && opts.migrated) return builder(table, () => []); // a candidate can no longer read the tables
      if (opts.reader === "clinic" && opts.owns === false) return builder(table, () => []); // not this clinic's job
      return builder(table, () => (table === "applications" ? rows : events));
    },
  };
  return { db, calls };
}

test("the clinic's page loader shows Shortlisted, with the shortlist step in the history", async () => {
  const { db } = fakeDb({ reader: "clinic" });
  const found = await loadApplicationWith(db, "a1", "clinic");
  assert.equal(found?.application.status, "shortlisted");
  assert.equal(found?.application.clinic_message, "internal note");
  assert.deepEqual(found?.history.map((h) => h.status), ["applied", "viewed", "shortlisted"]);
});

test("the clinic's page loader finds nothing for an application to another clinic's job", async () => {
  const { db } = fakeDb({ reader: "clinic", owns: false });
  assert.equal(await loadApplicationWith(db, "a1", "clinic"), null);
});

test("the clinic's page loader finds nothing for an id that does not exist", async () => {
  const { db } = fakeDb({ reader: "clinic" });
  assert.equal(await loadApplicationWith(db, "missing", "clinic"), null);
});

for (const migrated of [true, false]) {
  const where = migrated ? "after migration 0040" : "before migration 0040";

  test(`the candidate's page loader shows Viewed, no shortlist step and no message (${where})`, async () => {
    const { db } = fakeDb({ reader: "candidate", migrated });
    const found = await loadApplicationWith(db, "a1", "candidate");
    assert.equal(found?.application.status, "viewed");
    assert.equal(found?.application.clinic_message, null);
    assert.deepEqual(found?.history.map((h) => h.status), ["applied", "viewed"]);
    assert.equal(JSON.stringify(found).toLowerCase().includes("shortlist"), false, "the word shortlist appears nowhere in what a candidate is given");
  });

  test(`the candidate's list loader masks a shortlist (${where})`, async () => {
    const { db } = fakeDb({ reader: "candidate", migrated, rows: [app(), app({ id: "a2", status: "interview", clinic_message: "Come in Friday", created_at: "2026-11-06T10:00:00Z" })] });
    const list = await loadMyApplications(db);
    assert.deepEqual(list.map((a) => [a.id, a.status]), [["a2", "interview"], ["a1", "viewed"]], "newest first, shortlist shown as viewed");
    assert.equal(list[0].clinic_message, "Come in Friday", "other messages are kept");
    assert.equal(list[1].clinic_message, null);
  });

  test(`the candidate's page loader finds nothing for an id that is not theirs (${where})`, async () => {
    const { db } = fakeDb({ reader: "candidate", migrated, rows: [] });
    assert.equal(await loadApplicationWith(db, "a1", "candidate"), null);
  });
}

test("a candidate before migration 0040 is served from the table only after the masked copy fails", async () => {
  const { db, calls } = fakeDb({ reader: "candidate", migrated: false });
  await loadApplicationWith(db, "a1", "candidate");
  assert.equal(calls[0], "rpc:my_applications");
  assert.equal(calls[1], "applications");
});

test("a candidate after migration 0040 never reads the 2 tables directly", async () => {
  const { db, calls } = fakeDb({ reader: "candidate", migrated: true });
  await loadApplicationWith(db, "a1", "candidate");
  await loadMyApplications(db);
  assert.deepEqual(calls.filter((c) => !c.startsWith("rpc:")), []);
});
