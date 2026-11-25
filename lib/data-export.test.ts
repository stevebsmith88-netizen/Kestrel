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
  // The shortlist is hidden inside exportApplications (tested below), so the route must go through it and never read applications on its own.
  assert.match(src, /buildDataExport\(/);
  assert.doesNotMatch(src, /candidateStatus|candidateHistory|from\("applications"\)/);
  const helper = readFileSync(new URL("./data-export.ts", import.meta.url), "utf8");
  assert.match(helper, /candidateExtras\(db, id\)/);
  assert.match(helper, /exportApplications\(appRows/);
  assert.match(helper, /candidateStatus\(a\.status\)/);
  assert.match(helper, /shortlisted \? null/);
});

// Audit P1-31: the download must not hint at a shortlist.
import { exportApplications } from "./data-export.ts";

const appRow = (over: Record<string, unknown> = {}) => ({
  id: "a1", job_title: "Optician", clinic_name: "Harbourside Optical", job_location: "Toronto, Ontario", status: "applied", cover_letter: "Hello", keep_details: true,
  applicant: { name: "Sam" }, cv_filename: "resume.pdf", clinic_message: null, viewed_at: "2026-11-02T10:00:00Z", status_changed_at: "2026-11-02T10:00:00Z", created_at: "2026-11-01T10:00:00Z",
  ...over,
});

test("a shortlisted application shows as Viewed, with no status change date and no message", () => {
  const [a] = exportApplications([appRow({ status: "shortlisted", status_changed_at: "2026-11-05T09:30:00Z", clinic_message: "internal" })], []);
  assert.equal(a.status, "viewed");
  assert.equal(a.status_changed_at, null);
  assert.equal(a.clinic_message, null);
  assert.equal(JSON.stringify(a).includes("2026-11-05"), false, "the shortlist date appears nowhere");
});

test("other applications keep their status change date and their message", () => {
  const [a] = exportApplications([appRow({ status: "interview", status_changed_at: "2026-11-06T09:00:00Z", clinic_message: "Come in on Friday" })], []);
  assert.equal(a.status, "interview");
  assert.equal(a.status_changed_at, "2026-11-06T09:00:00Z");
  assert.equal(a.clinic_message, "Come in on Friday");
});

test("the history shows a shortlist as Viewed and drops the repeat", () => {
  const events = [
    { application_id: "a1", status: "applied", note: null, created_at: "2026-11-01T10:00:00Z" },
    { application_id: "a1", status: "viewed", note: null, created_at: "2026-11-02T10:00:00Z" },
    { application_id: "a1", status: "shortlisted", note: null, created_at: "2026-11-05T09:30:00Z" },
    { application_id: "other", status: "interview", note: "x", created_at: "2026-11-06T09:00:00Z" },
  ];
  const [a] = exportApplications([appRow({ status: "shortlisted" })], events);
  assert.deepEqual(a.history.map((h) => h.status), ["applied", "viewed"]);
  assert.equal(JSON.stringify(a).includes("2026-11-05"), false);
  assert.equal("id" in a, false, "the internal id is not exported");
});

// Audit P1-19(b): what the download actually contains. A stand in database holds 2 people's data and applies the filters the way the real one does.
import { buildDataExport } from "./data-export.ts";

type Row = Record<string, unknown>;
function tableDb(tables: Record<string, Row[]>, failing: string[] = []) {
  const reads: { table: string; columns: string; filters: string[] }[] = [];
  const db: ExportDb = {
    from(table: string) {
      return {
        select(columns: string) {
          let list = (tables[table] ?? []).map((r) => ({ ...r }));
          const read = { table, columns, filters: [] as string[] };
          reads.push(read);
          const chain: any = {
            eq: (c: string, v: string) => { read.filters.push(`${c}=${v}`); list = list.filter((r) => r[c] === v); return chain; },
            in: (c: string, v: string[]) => { read.filters.push(`${c} in ${v.join(",")}`); list = list.filter((r) => v.includes(r[c] as string)); return chain; },
            order: () => chain,
            maybeSingle: () => { chain.single = true; return chain; },
            then: (ok: any, bad: any) => {
              const broken = failing.includes(table) || columns.split(",").some((c) => failing.includes(c.trim()));
              // Like the real database, only the columns asked for come back.
              const wanted = columns.split(",").map((c) => c.trim());
              const shaped = list.map((r) => Object.fromEntries(wanted.filter((c) => c in r).map((c) => [c, r[c]])));
              const result = broken ? { data: null, error: { message: "does not exist" } } : { data: chain.single ? (shaped[0] ?? null) : shaped, error: null };
              return Promise.resolve(result).then(ok, bad);
            },
          };
          return chain;
        },
      };
    },
  };
  return { db, reads };
}

const ME = "user-me";
const OTHER = "user-other";
const world = (): Record<string, Row[]> => ({
  profiles: [{ id: ME, role: "candidate", first_name: "Sam", last_name: "Lee", full_name: "Sam Lee", marketing_consent: true, created_at: "2026-10-01", name_changed_at: "2026-10-05" }, { id: OTHER, role: "candidate", first_name: "Other", last_name: "Person" }],
  job_alerts: [{ user_id: ME, role_category: "Optician", province: "Ontario", frequency: "weekly" }, { user_id: OTHER, role_category: "Optometrist", province: "Alberta", frequency: "daily" }],
  notifications: [{ user_id: ME, kind: "status", title: "Your application moved", body: "x", href: "/candidate", created_at: "2026-11-02" }, { user_id: OTHER, kind: "status", title: "OTHER PERSON NOTE", body: "y", href: "/candidate" }],
  candidate_profiles: [{ user_id: ME, profession: "Optician", phone: "416", cv_filename: "r.pdf", cv_path: "secret/path.pdf", career_stage: "early" }, { user_id: OTHER, profession: "Optometrist", phone: "999" }],
  applications: [
    { id: "a1", candidate_id: ME, job_title: "Optician", clinic_name: "Harbourside", status: "shortlisted", clinic_message: "internal", status_changed_at: "2026-11-05T09:30:00Z", applicant: { name: "Sam" } },
    { id: "a2", candidate_id: OTHER, job_title: "Optometrist", clinic_name: "Elsewhere", status: "applied", applicant: { name: "Other Person" } },
  ],
  application_events: [
    { application_id: "a1", status: "applied", note: null, created_at: "2026-11-01" }, { application_id: "a1", status: "viewed", note: null, created_at: "2026-11-02" }, { application_id: "a1", status: "shortlisted", note: null, created_at: "2026-11-05T09:30:00Z" },
    { application_id: "a2", status: "applied", note: "OTHER PERSON EVENT", created_at: "2026-11-01" },
  ],
  cover_letter_templates: [{ user_id: ME, name: "Mine", body: "Hello" }, { user_id: OTHER, name: "OTHER TEMPLATE", body: "x" }],
  application_drafts: [{ user_id: ME, cover_letter: "draft" }, { user_id: OTHER, cover_letter: "OTHER DRAFT" }],
  candidate_job_hides: [{ user_id: ME, job_id: "j9", created_at: "2026-11-03" }, { user_id: OTHER, job_id: "j8", created_at: "2026-11-03" }],
  jobs: [{ id: "j9", title: "A job I hid", employer_id: "e-other" }, { id: "j1", title: "My clinic job", employer_id: "e1", description: "Ad", status: "live" }, { id: "j2", title: "OTHER CLINIC JOB", employer_id: "e2" }],
  employers: [{ id: "e1", owner_id: "clinic-me", clinic_name: "My Clinic", province: "Ontario" }, { id: "e2", owner_id: "clinic-other", clinic_name: "OTHER CLINIC" }],
  employer_contacts: [{ employer_id: "e1", notify_email: "hr@myclinic.ca", employee_band: "10_24" }, { employer_id: "e2", notify_email: "other@clinic.ca" }],
  job_templates: [{ employer_id: "e1", name: "My template" }, { employer_id: "e2", name: "OTHER TEMPLATE 2" }],
});

test("a candidate's download holds their own information and nothing about anyone else", async () => {
  const { db } = tableDb(world());
  const out = await buildDataExport(db, { userId: ME, email: "sam@example.com", role: "candidate" });
  const text = JSON.stringify(out);
  assert.equal(text.includes("OTHER"), false, "nothing belonging to the other person appears");
  assert.equal(text.includes("Other Person") || text.includes("999") || text.includes("Alberta"), false);
  assert.equal((out.account as Row).email, "sam@example.com");
  assert.equal((out.account as Row).first_name, "Sam");
  assert.equal((out.account as Row).name_last_changed_at, "2026-10-05");
  assert.equal((out.jobAlerts as Row[]).length, 1);
  assert.equal((out.inbox as Row[]).length, 1);
  assert.equal((out.savedCoverLetters as Row[]).length, 1);
  assert.equal((out.applicationDrafts as Row[]).length, 1);
  assert.equal((out.candidateProfile as Row).profession, "Optician");
  assert.equal(out.careerStage, "early");
  assert.deepEqual(out.jobsMarkedNotInterested, [{ job_title: "A job I hid", marked_at: "2026-11-03" }]);
  assert.equal((out.applications as Row[]).length, 1);
});

test("a candidate's download never includes the stored resume path, internal ids, or a hint of a shortlist", async () => {
  const { db } = tableDb(world());
  const out = await buildDataExport(db, { userId: ME, email: "sam@example.com", role: "candidate" });
  const text = JSON.stringify(out);
  assert.equal(text.includes("secret/path.pdf"), false, "the storage path of the resume is not exported");
  const [a] = out.applications as Row[];
  assert.equal("id" in a, false);
  assert.equal(a.status, "viewed");
  assert.equal(a.clinic_message, null);
  assert.equal(a.status_changed_at, null);
  assert.equal(text.toLowerCase().includes("shortlist"), false);
  assert.equal(text.includes("2026-11-05"), false);
  assert.equal("applications" in out && "jobs" in out, false, "a candidate's download has no clinic section");
});

test("every read of a person's own tables is limited to that person's id", async () => {
  const { db, reads } = tableDb(world());
  await buildDataExport(db, { userId: ME, email: "sam@example.com", role: "candidate" });
  const own = new Set(["profiles", "job_alerts", "notifications", "candidate_profiles", "applications", "cover_letter_templates", "application_drafts", "candidate_job_hides"]);
  for (const r of reads.filter((x) => own.has(x.table))) {
    assert.ok(r.filters.some((f) => f.endsWith(`=${ME}`)), `${r.table} is read without limiting it to the person's id: ${r.filters.join(", ")}`);
  }
  const events = reads.find((r) => r.table === "application_events");
  assert.equal(events?.filters.join(), "application_id in a1", "history is read only for the person's own applications");
});

test("a clinic's download holds its own profile and jobs, never an applicant's details", async () => {
  const { db, reads } = tableDb({ ...world(), profiles: [{ id: "clinic-me", role: "clinic", full_name: "Clinic Owner" }] });
  const out = await buildDataExport(db, { userId: "clinic-me", email: "hr@myclinic.ca", role: "clinic" });
  const text = JSON.stringify(out);
  assert.equal(text.includes("OTHER"), false);
  assert.equal((out.clinic as Row).clinic_name, "My Clinic");
  assert.equal((out.clinic as Row).id, undefined, "the internal id is not exported");
  assert.equal((out.clinic as Row).alertEmail, "hr@myclinic.ca");
  assert.equal((out.clinic as Row).employeeCount, "10_24");
  assert.deepEqual((out.jobs as Row[]).map((j) => j.title), ["My clinic job"]);
  assert.deepEqual((out.jobTemplates as Row[]).map((t) => t.name), ["My template"]);
  assert.equal("applications" in out, false, "a clinic's download has no applications");
  assert.equal(reads.some((r) => r.table === "applications"), false, "applications are not even read for a clinic");
  assert.equal(text.includes("Sam"), false);
});

test("a clinic with no profile yet gets a download with no clinic section and no error", async () => {
  const { db } = tableDb({ profiles: [{ id: "clinic-new", role: "clinic" }] });
  const out = await buildDataExport(db, { userId: "clinic-new", email: "new@clinic.ca", role: "clinic" });
  assert.equal(out.clinic, null);
  assert.deepEqual(out.jobs, []);
});

test("the download still works on a database that has not had the newer migrations", async () => {
  const { db } = tableDb(world(), ["candidate_job_hides", "career_stage", "name_changed_at", "pref_radius_km"]);
  const out = await buildDataExport(db, { userId: ME, email: "sam@example.com", role: "candidate" });
  assert.equal(out.careerStage, null);
  assert.deepEqual(out.jobsMarkedNotInterested, []);
  assert.equal((out.account as Row).name_last_changed_at, null);
  assert.equal((out.applications as Row[]).length, 1);
});
