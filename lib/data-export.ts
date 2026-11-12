// The parts of a candidate's data download that live in columns and tables added by later migrations (0031, 0037, 0039).
// Each is read on its own and an error is tolerated, so the download still works on a database that has not had that SQL yet.

import { candidateHistory, candidateStatus } from "./applications.ts";

type Result = { data: unknown; error: { message: string } | null };
type Chain = PromiseLike<Result> & { eq(c: string, v: string): Chain; in(c: string, v: string[]): Chain; order(c: string, o?: object): Chain; maybeSingle(): PromiseLike<Result> };
export type ExportDb = { from(table: string): { select(columns: string): Chain } };

const PREFS = "home_city, home_province, pref_radius_km, pref_provinces, pref_employment_types, pref_other_roles, pref_min_pay, pref_pay_period, pref_practice";

async function ok(q: PromiseLike<Result>): Promise<unknown> {
  try {
    const r = await q;
    return r.error ? null : r.data;
  } catch {
    return null;
  }
}

export async function candidateExtras(db: ExportDb, userId: string) {
  const [prefs, stage, nameDate, hides] = await Promise.all([
    ok(db.from("candidate_profiles").select(PREFS).eq("user_id", userId).maybeSingle()),
    ok(db.from("candidate_profiles").select("career_stage").eq("user_id", userId).maybeSingle()),
    ok(db.from("profiles").select("name_changed_at").eq("id", userId).maybeSingle()),
    ok(db.from("candidate_job_hides").select("job_id, created_at").eq("user_id", userId).order("created_at", { ascending: false })),
  ]);
  const hideRows = Array.isArray(hides) ? (hides as { job_id: string; created_at: string }[]) : [];
  const jobs = hideRows.length ? ok(db.from("jobs").select("id, title").in("id", hideRows.map((h) => h.job_id))) : Promise.resolve(null);
  const titles = new Map((Array.isArray(await jobs) ? ((await jobs) as { id: string; title: string }[]) : []).map((j) => [j.id, j.title]));
  return {
    preferences: prefs ?? null,
    careerStage: (stage as { career_stage?: string | null } | null)?.career_stage ?? null,
    nameLastChangedAt: (nameDate as { name_changed_at?: string | null } | null)?.name_changed_at ?? null,
    jobsMarkedNotInterested: hideRows.map((h) => ({ job_title: titles.get(h.job_id) ?? null, marked_at: h.created_at })),
  };
}

type ApplicationRow = { id: string; status: string; clinic_message: string | null; status_changed_at: string | null; [column: string]: unknown };
type EventRow = { application_id: string; status: string; note: string | null; created_at: string };

// A candidate's applications as they appear in the download. A shortlist is the clinic's own working list, so it shows as Viewed, with no
// message and no "status changed" date (that date moves the moment a clinic shortlists, audit P1-31), and the history shows it as Viewed too.
export function exportApplications(apps: readonly ApplicationRow[], events: readonly EventRow[]) {
  return apps.map(({ id, ...a }) => {
    const shortlisted = a.status === "shortlisted";
    return {
      ...a,
      status: candidateStatus(a.status),
      clinic_message: shortlisted ? null : a.clinic_message,
      status_changed_at: shortlisted ? null : a.status_changed_at,
      history: candidateHistory(events.filter((e) => e.application_id === id)).map(({ status, note, created_at }) => ({ status, note, at: created_at })),
    };
  });
}
