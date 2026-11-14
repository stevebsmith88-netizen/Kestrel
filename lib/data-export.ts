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

const list = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

// Everything the download holds about 1 account, looked up by that account's own id. The route checks who is asking (and the password) first.
// A clinic's download covers its own profile and jobs, never other people's applications (audit P1-19, tested in lib/data-export.test.ts).
export async function buildDataExport(db: ExportDb, who: { userId: string; email: string; role: string }) {
  const { userId: id, email } = who;
  const [profile, alerts] = await Promise.all([
    db.from("profiles").select("role, first_name, last_name, full_name, marketing_consent, marketing_consent_text, marketing_consent_at, unsubscribed_at, created_at").eq("id", id).maybeSingle(),
    db.from("job_alerts").select("role_category, province, practice_type, frequency, created_at").eq("user_id", id),
  ]);

  const data: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    note: "This is the personal information Kestrel Eye Care Jobs holds about your account. Your resume file can be downloaded from your profile page.",
    account: { email: email, ...(profile.data ?? {}) },
    jobAlerts: alerts.data ?? [],
    inbox: (await db.from("notifications").select("kind, title, body, href, read_at, created_at").eq("user_id", id).order("created_at", { ascending: false })).data ?? [],
  };

  if (who.role === "candidate") {
    const [cp, apps] = await Promise.all([
      db.from("candidate_profiles").select("profession, licensed_provinces, software_skills, years_experience, available_from, phone, cv_filename, cv_uploaded_at, created_at, updated_at").eq("user_id", id).maybeSingle(),
      db.from("applications").select("id, job_title, clinic_name, job_location, status, cover_letter, keep_details, applicant, cv_filename, clinic_message, viewed_at, status_changed_at, created_at").eq("candidate_id", id).order("created_at", { ascending: false }),
    ]);
    const [letters, drafts] = await Promise.all([
      db.from("cover_letter_templates").select("name, body, created_at, updated_at").eq("user_id", id),
      db.from("application_drafts").select("cover_letter, updated_at").eq("user_id", id),
    ]);
    data.savedCoverLetters = letters.data ?? [];
    data.applicationDrafts = drafts.data ?? [];
    const appRows = list<ApplicationRow>(apps.data);
    const appIds = appRows.map((a) => a.id);
    const events = appIds.length ? await db.from("application_events").select("application_id, status, note, created_at").in("application_id", appIds).order("created_at") : { data: [] };
    data.candidateProfile = cp.data ?? null;
    // What the candidate chose for "Recommended for you", the career stage answer, hidden jobs and the name change date. All private to them.
    const extras = await candidateExtras(db, id);
    data.preferences = extras.preferences;
    data.careerStage = extras.careerStage;
    data.jobsMarkedNotInterested = extras.jobsMarkedNotInterested;
    (data.account as Record<string, unknown>).name_last_changed_at = extras.nameLastChangedAt;
    data.applications = exportApplications(appRows, list<EventRow>(events.data));
  } else {
    // Every location this account owns (migration 0047). The first is "clinic", as before; any others are under "otherLocations".
    const owned = await db.from("employers").select("id, clinic_name, practice_type, website, province, city, about, direct_hire_confirmed_at, created_at").eq("owner_id", id).order("created_at");
    const locations = (Array.isArray(owned.data) ? owned.data : owned.data ? [owned.data] : []) as ({ id: string } & Record<string, unknown>)[];
    const one = async (employer: { id: string } & Record<string, unknown>) => {
      const contact = await db.from("employer_contacts").select("notify_email, employee_band").eq("employer_id", employer.id).maybeSingle();
      const contactRow = contact.data as { notify_email?: string | null; employee_band?: string | null } | null;
      const jobs = await db.from("jobs").select("title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, pay_extras, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, status, posted_at, expires_at, created_at").eq("employer_id", employer.id).order("created_at", { ascending: false });
      const templates = await db.from("job_templates").select("name, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, description, apply_method, apply_url, work_arrangement, territory, pay_extras, updated_at").eq("employer_id", employer.id);
      return { clinic: { ...employer, id: undefined, alertEmail: contactRow?.notify_email ?? null, employeeCount: contactRow?.employee_band ?? null }, jobs: (jobs.data ?? []) as unknown[], jobTemplates: (templates.data ?? []) as unknown[] };
    };
    const all = await Promise.all(locations.map(one));
    data.clinic = all[0]?.clinic ?? null;
    data.jobs = all[0]?.jobs ?? [];
    data.jobTemplates = all[0]?.jobTemplates ?? [];
    if (all.length > 1) data.otherLocations = all.slice(1);
  }
  return data;
}
