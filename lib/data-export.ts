// The parts of a candidate's data download that live in columns and tables added by later migrations (0031, 0037, 0039).
// Each is read on its own and an error is tolerated, so the download still works on a database that has not had that SQL yet.

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
