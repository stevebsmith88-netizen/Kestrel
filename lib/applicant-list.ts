// The clinic's applicants list for 1 job (review item X-16): the database read and the sorting into tabs, kept out of the page so it
// can be tested against a stand in database (lib/applicant-list.test.ts). The database only returns applications to the clinic's own
// jobs (row level security), and the page checks the job is the clinic's own before calling this. Kept free of app imports.

import { HIREABLE, groupOf, type Group } from "./applications.ts";
import { IN_TALKS } from "./still-talking.ts";

export type ApplicantRow = {
  id: string; status: string; clinic_name?: string; created_at: string; cover_letter: string | null;
  applicant: { name?: string; profession?: string | null; years_experience?: string | null; licensed_provinces?: string[] };
};

export const WAITING = ["applied", "viewed", "shortlisted"];
export const FILTERS: (Group | "all")[] = ["all", "review", "interview", "offer", "closed"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the Supabase builder, or a stand in for it in the tests (as in lib/my-applications.ts)
type Query = any;
export type ApplicantDb = { from(table: string): Query };

const named = (r: ApplicantRow) => ({ id: r.id, status: r.status, name: r.applicant?.name?.trim() || "Applicant" });

export async function loadApplicants(db: ApplicantDb | null, jobId: string, filter?: string) {
  const { data } = db
    ? await db.from("applications").select("id, status, created_at, cover_letter, applicant, clinic_name").eq("job_id", jobId).order("created_at", { ascending: false })
    : { data: null };
  const rows = ((data ?? []) as ApplicantRow[]).map((r) => ({ ...r, applicant: r.applicant ?? {} }));
  const active: Group | "all" = (FILTERS as string[]).includes(filter ?? "") ? (filter as Group | "all") : "all";
  const shown = active === "all" ? rows : rows.filter((r) => groupOf(r.status) === active);
  return {
    rows,
    active,
    shown,
    count: (f: Group | "all") => (f === "all" ? rows.length : rows.filter((r) => groupOf(r.status) === f).length),
    waiting: rows.filter((r) => WAITING.includes(r.status)),
    // The people the clinic could name as the one it hired, for the "role filled" form.
    hireCandidates: rows.filter((r) => (HIREABLE as readonly string[]).includes(r.status)).map(named),
    // The people at Interview or Offer, listed on the "role filled" form with a message each (P1-13).
    talking: rows.filter((r) => (IN_TALKS as readonly string[]).includes(r.status)).map(named),
    clinicName: rows[0]?.clinic_name ?? "",
    // When any row has a tick box, every row gets the tick box column, so the names line up down the page.
    anyTick: shown.some((r) => WAITING.includes(r.status)),
  };
}
