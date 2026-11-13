// Run with: npm test
// The admin page loaders (review item X-16), against a stand in database that answers the way Supabase does.
import assert from "node:assert/strict";
import { test } from "node:test";
import { clinicSearchPattern, loadClaims, loadClinicForPosting, loadClinicsForPosting, loadFound, loadOutreach, loadReports, loadSuppressions, loadWaitlist } from "./admin-loaders.ts";

type Tables = Record<string, any[]>;
// failColumns: a table that refuses a select naming that column, as a database without a migration would.
function fakeDb(tables: Tables, opts: { failColumns?: Record<string, string> } = {}) {
  const log: { table: string; select: string; filters: string[] }[] = [];
  return {
    log,
    db: {
      from(table: string) {
        let list = [...(tables[table] ?? [])];
        const entry = { table, select: "", filters: [] as string[] };
        log.push(entry);
        let single = false;
        let failed = false;
        let count = false;
        const q: any = {
          select: (cols: string, o?: { count?: string; head?: boolean }) => {
            entry.select = cols;
            count = Boolean(o?.count);
            if (opts.failColumns?.[table] && cols.includes(opts.failColumns[table])) failed = true;
            return q;
          },
          eq: (c: string, v: unknown) => { entry.filters.push(`${c}=${v}`); list = list.filter((r) => r[c] === v); return q; },
          neq: (c: string, v: unknown) => { entry.filters.push(`${c}!=${v}`); list = list.filter((r) => r[c] !== v); return q; },
          in: (c: string, vs: unknown[]) => { entry.filters.push(`${c} in`); list = list.filter((r) => vs.includes(r[c])); return q; },
          not: (c: string, op: string, v: unknown) => {
            entry.filters.push(`${c} not ${op} ${v}`);
            if (op === "is" && v === null) list = list.filter((r) => r[c] !== null && r[c] !== undefined);
            if (op === "like") list = list.filter((r) => !String(r[c]).startsWith(String(v).replace("%", "")));
            return q;
          },
          gte: (c: string, v: string) => { entry.filters.push(`${c}>=`); list = list.filter((r) => String(r[c]) >= v); return q; },
          ilike: (c: string, p: string) => {
            entry.filters.push(`${c} ilike ${p}`);
            const needle = p.replace(/%/g, "").trim().toLowerCase();
            list = list.filter((r) => String(r[c]).toLowerCase().includes(needle));
            return q;
          },
          order: (c: string, o: { ascending: boolean }) => { list.sort((x, y) => String(x[c]).localeCompare(String(y[c])) * (o.ascending ? 1 : -1)); return q; },
          limit: (n: number) => { list = list.slice(0, n); return q; },
          maybeSingle: () => { single = true; return q; },
          then: (ok: any, bad: any) =>
            Promise.resolve(failed ? { data: null, error: { message: "column does not exist" }, count: null } : { data: single ? (list[0] ?? null) : list, error: null, count: count ? list.length : null }).then(ok, bad),
        };
        return q;
      },
    },
  };
}

test("no database: every admin page gets empty lists, not an error", async () => {
  assert.equal((await loadOutreach(null)).ready.length, 0);
  assert.equal((await loadWaitlist(null)).rows.length, 0);
  assert.equal((await loadClinicsForPosting(null, "x")).length, 0);
  assert.equal(await loadClinicForPosting(null, "e1"), null);
  assert.equal((await loadClaims(null)).claims.length, 0);
  assert.equal((await loadReports(null)).length, 0);
  assert.equal((await loadFound(null, "u1")).drafts.length, 0);
  assert.equal((await loadSuppressions(null)).length, 0);
});

test("outreach: only leads with an email, not skipped, and not already in the sequence whatever the capitals", async () => {
  const { db } = fakeDb({
    clinic_leads: [
      { id: "l1", contact_email: "Hiring@One.example", status: "new", found_at: "3" },
      { id: "l2", contact_email: "two@two.example", status: "new", found_at: "2" },
      { id: "l3", contact_email: null, status: "new", found_at: "1" },
      { id: "l4", contact_email: "four@four.example", status: "skipped", found_at: "4" },
    ],
    outreach_contacts: [{ id: "c1", email: "hiring@one.example", status: "active", approved_at: "1" }],
  });
  const r = await loadOutreach(db);
  assert.deepEqual(r.ready.map((l) => l.id), ["l2"]);
  assert.equal(r.contacts.length, 1);
});

test("waitlist: newest first with the total, and still shows on a database without the source columns", async () => {
  const rows = [{ id: "w1", created_at: "2026-11-01" }, { id: "w2", created_at: "2026-11-05" }];
  const ok = await loadWaitlist(fakeDb({ waitlist: rows }).db);
  assert.deepEqual(ok.rows.map((r) => r.id), ["w2", "w1"]);
  assert.equal(ok.count, 2);
  const old = fakeDb({ waitlist: rows }, { failColumns: { waitlist: "utm_source" } });
  const fallback = await loadWaitlist(old.db);
  assert.equal(fallback.rows.length, 2, "falls back to the columns every database has");
  assert.equal(old.log.length, 2);
});

test("post for a clinic: only clinics with an account, and the search cannot change the query", async () => {
  assert.equal(clinicSearchPattern(""), "%");
  assert.equal(clinicSearchPattern("  Harbour  "), "%Harbour%");
  assert.equal(clinicSearchPattern("a%b,c(d)"), "%a b c d %");
  assert.equal(clinicSearchPattern("x".repeat(200)).length, 82);
  const { db, log } = fakeDb({ employers: [
    { id: "e1", clinic_name: "Harbourside Optical", owner_id: "u1" },
    { id: "e2", clinic_name: "Harbour Found Listing", owner_id: null },
  ] });
  const found = await loadClinicsForPosting(db, "harbour");
  assert.deepEqual(found.map((c) => c.id), ["e1"]);
  assert.ok(log[0].filters.includes("owner_id not is null"));
  assert.equal((await loadClinicForPosting(db, "e2"))?.id, "e2");
  assert.equal(await loadClinicForPosting(db, "nope"), null);
});

test("claims: only those waiting for a decision, oldest first, each with a live job of that clinic", async () => {
  const { db } = fakeDb({
    listing_claims: [
      { id: "k2", status: "pending_review", created_at: "2026-11-05", employers: { id: "e2" } },
      { id: "k1", status: "pending_review", created_at: "2026-11-01", employers: { id: "e1" } },
      { id: "k3", status: "approved", created_at: "2026-10-01", employers: { id: "e3" } },
    ],
    jobs: [{ id: "j1", employer_id: "e1", status: "live" }, { id: "j2", employer_id: "e2", status: "draft" }],
  });
  const r = await loadClaims(db);
  assert.deepEqual(r.claims.map((c) => c.id), ["k1", "k2"]);
  assert.deepEqual(r.liveJobByEmployer, { e1: "j1" });
});

test("reports: only open ones, oldest first", async () => {
  const { db } = fakeDb({ job_reports: [{ id: "r2", status: "open", created_at: "2" }, { id: "r1", status: "open", created_at: "1" }, { id: "r0", status: "dismissed", created_at: "0" }] });
  assert.deepEqual((await loadReports(db)).map((r) => r.id), ["r1", "r2"]);
});

test("found listings: drafts, live and ended are sorted correctly, and only this admin's page reads count", async () => {
  const now = Date.parse("2026-11-13T12:00:00Z");
  const { db } = fakeDb({
    clinic_leads: [{ id: "l1", found_at: "1" }],
    jobs: [
      { id: "d1", is_seeded: true, status: "draft", expires_at: null, created_at: "4" },
      { id: "v1", is_seeded: true, status: "live", expires_at: "2026-11-20T00:00:00Z", created_at: "3" },
      { id: "x1", is_seeded: true, status: "live", expires_at: "2026-11-10T00:00:00Z", created_at: "2" }, // past its date, not yet marked
      { id: "x2", is_seeded: true, status: "expired", expires_at: "2026-11-01T00:00:00Z", created_at: "1" },
      { id: "n1", is_seeded: false, status: "live", expires_at: "2026-12-01T00:00:00Z", created_at: "5" },
    ],
    page_reads: [
      { read_by: "u1", url: "https://clinic.example/careers", read_at: "2026-11-13T09:00:00.000Z" },
      { read_by: "u1", url: "search:Ontario", read_at: "2026-11-13T09:00:00.000Z" },
      { read_by: "u2", url: "https://other.example", read_at: "2026-11-13T09:00:00.000Z" },
      { read_by: "u1", url: "https://old.example", read_at: "2026-11-10T09:00:00.000Z" },
    ],
  });
  const r = await loadFound(db, "u1", now);
  assert.deepEqual(r.drafts.map((j) => j.id), ["d1"]);
  assert.deepEqual(r.live.map((j) => j.id), ["v1"]);
  assert.deepEqual(r.ended.map((j) => j.id), ["x1", "x2"]);
  assert.equal(r.readsToday, 1);
  assert.equal(r.needsMigration, false);
  assert.equal(r.leads.length, 1);
});

test("found listings: a database without the page reads table says so instead of failing", async () => {
  const r = await loadFound(fakeDb({ jobs: [] }, { failColumns: { page_reads: "id" } }).db, "u1");
  assert.equal(r.needsMigration, true);
});

test("suppressions: newest first", async () => {
  const { db } = fakeDb({ email_suppressions: [{ id: "s1", created_at: "1" }, { id: "s2", created_at: "2" }] });
  assert.deepEqual((await loadSuppressions(db)).map((r) => r.id), ["s2", "s1"]);
});
