import { withExpected } from "@/lib/expected-columns";
import "server-only";
import { cookies } from "next/headers";
import { HIREABLE } from "@/lib/applications";
import { supabaseServer } from "@/lib/supabase/server";
import type { JobStatus } from "@/lib/jobs";
import { canEdit, type ClinicLevel } from "@/lib/team";

export type Employer = {
  id: string;
  clinic_name: string;
  practice_type: string;
  website: string | null;
  province: string;
  city: string;
  about: string | null;
  notify_email: string;
  employee_band: string | null; // from the private contact table, never shown publicly
  direct_hire_confirmed_at: string | null;
  // Who the signed in person is to this clinic: its owner, or a team member who can view and edit, or view only (migration 0045).
  level: ClinicLevel;
};

export type MyJob = {
  id: string;
  title: string;
  role_category: string | null;
  employment_type: string | null;
  province: string | null;
  city: string | null;
  pay_period: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_is_minimum: boolean | null;
  pay_days_per_week: number | null;
  pay_percent_min: number | null;
  pay_percent_max: number | null;
  pay_percent_of: string | null;
  pay_expected_min?: number | null; // migration 0043
  pay_expected_max?: number | null;
  pay_expected_period?: string | null;
  tags_software: string[] | null;
  tags_equipment: string[] | null;
  tags_specialties: string[] | null;
  is_existing_vacancy: boolean | null;
  uses_ai_screening: boolean | null;
  description: string | null;
  apply_method: string;
  apply_url: string | null;
  work_arrangement: string;
  territory: string | null;
  pay_extras: string | null;
  status: JobStatus;
  review_note: string | null;
  posted_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const JOB_COLUMNS =
  "id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, work_arrangement, territory, pay_extras, status, review_note, posted_at, expires_at, created_at";

// The signed in person's clinics: the locations they own, then the ones whose team they are on (migrations 0045 and 0047). Row level
// security means only their own. On a database without the team tables, only owned locations, as before.
const EMPLOYER_COLUMNS = "id, clinic_name, practice_type, website, province, city, about, direct_hire_confirmed_at";
export const LOCATION_COOKIE = "kestrel_location";

export type MyClinic = { id: string; clinic_name: string; city: string; province: string; level: ClinicLevel };

export async function getMyClinics(userId: string): Promise<MyClinic[]> {
  const db = await supabaseServer();
  if (!db) return [];
  const { data: owned } = await db.from("employers").select("id, clinic_name, city, province").eq("owner_id", userId).order("created_at");
  const { data: memberships, error } = await db.from("employer_members").select("employer_id, level").eq("user_id", userId);
  const ownedRows = (owned ?? []).map((e) => ({ ...(e as Omit<MyClinic, "level">), level: "owner" as const }));
  const memberIds = error ? [] : (memberships ?? []).map((m) => m.employer_id as string).filter((id) => !ownedRows.some((o) => o.id === id));
  const { data: teams } = memberIds.length ? await db.from("employers").select("id, clinic_name, city, province").in("id", memberIds) : { data: [] };
  const levelOf = new Map((memberships ?? []).map((m) => [m.employer_id as string, m.level === "edit" ? ("edit" as const) : ("view" as const)]));
  return [...ownedRows, ...((teams ?? []) as Omit<MyClinic, "level">[]).map((t) => ({ ...t, level: levelOf.get(t.id) ?? ("view" as const) }))];
}

// The location the person is working in now: the one they picked (a cookie, lib/location-actions.ts), or their first. Every clinic page
// and action works on this 1 location, so nothing can reach another location by mistake.
export async function getMyEmployer(userId: string): Promise<Employer | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const clinics = await getMyClinics(userId);
  if (!clinics.length) return null;
  let picked: string | undefined;
  try {
    picked = (await cookies()).get(LOCATION_COOKIE)?.value;
  } catch {
    picked = undefined; // outside a request
  }
  const current = clinics.find((c) => c.id === picked) ?? clinics[0];
  const { data } = await db.from("employers").select(EMPLOYER_COLUMNS).eq("id", current.id).maybeSingle();
  if (!data) return null;
  if (current.level === "owner") {
    const { data: contact } = await db.from("employer_contacts").select("notify_email, employee_band").eq("employer_id", data.id).maybeSingle();
    return { ...data, notify_email: contact?.notify_email ?? "", employee_band: contact?.employee_band ?? null, level: "owner" } as Employer;
  }
  // The private alert address and the staff count are the owner's; a team member never sees them.
  return { ...data, notify_email: "", employee_band: null, level: current.level } as Employer;
}

// For server actions that change jobs or applicants: the signed in person's clinic, only if they may make changes.
export async function getMyEditableEmployer(userId: string): Promise<Employer | null> {
  const employer = await getMyEmployer(userId);
  return employer && canEdit(employer.level) ? employer : null;
}

export async function getMyJobs(employerId: string): Promise<MyJob[]> {
  const db = await supabaseServer();
  if (!db) return [];
  const { data } = await db.from("jobs").select(await withExpected(JOB_COLUMNS)).eq("employer_id", employerId).order("created_at", { ascending: false });
  return (data ?? []) as unknown as MyJob[];
}

// How many people applied to each of this clinic's jobs, and how many are still unread.
export async function getApplicantCounts(): Promise<Record<string, { total: number; fresh: number; waiting: number }>> {
  const db = await supabaseServer();
  if (!db) return {};
  const { data } = await db.from("applications").select("job_id, status");
  const counts: Record<string, { total: number; fresh: number; waiting: number }> = {};
  (data ?? []).forEach((row) => {
    const c = (counts[row.job_id] ??= { total: 0, fresh: 0, waiting: 0 });
    c.total += 1;
    if (row.status === "applied" || row.status === "viewed" || row.status === "shortlisted") c.waiting += 1;
    if (row.status === "applied") c.fresh += 1;
  });
  return counts;
}

// The people a clinic can name as the one it hired for a job: everyone who applied and is still in the running.
// The database only returns applications for this clinic's own jobs.
export type HireCandidate = { id: string; name: string; status: string; clinicName?: string };

export async function getHireCandidates(jobId: string): Promise<HireCandidate[]> {
  const db = await supabaseServer();
  if (!db) return [];
  const { data } = await db.from("applications").select("id, status, applicant, clinic_name").eq("job_id", jobId).in("status", [...HIREABLE]).order("created_at", { ascending: true });
  return (data ?? []).map((a) => ({ id: a.id as string, status: a.status as string, name: String((a.applicant as { name?: string } | null)?.name ?? "").trim() || "Applicant", clinicName: String(a.clinic_name ?? "") }));
}

export async function getMyJob(id: string): Promise<MyJob | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db.from("jobs").select(await withExpected(JOB_COLUMNS)).eq("id", id).maybeSingle();
  return (data as unknown as MyJob | null) ?? null;
}

// A saved starting point for a job post. The two questions every post must answer (existing vacancy and AI
// screening) are not saved, so they are answered fresh each time.
export type JobTemplate = {
  id: string;
  name: string;
  title: string | null;
  role_category: string | null;
  employment_type: string | null;
  province: string | null;
  city: string | null;
  pay_period: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_is_minimum: boolean | null;
  pay_days_per_week: number | null;
  pay_percent_min: number | null;
  pay_percent_max: number | null;
  pay_percent_of: string | null;
  tags_software: string[] | null;
  tags_equipment: string[] | null;
  tags_specialties: string[] | null;
  description: string | null;
  apply_method: string;
  apply_url: string | null;
  work_arrangement: string;
  territory: string | null;
  pay_extras: string | null;
  updated_at: string;
};

const TEMPLATE_COLUMNS = "id, name, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, description, apply_method, apply_url, work_arrangement, territory, pay_extras, updated_at";

export async function getMyTemplates(): Promise<JobTemplate[]> {
  const db = await supabaseServer();
  if (!db) return [];
  const { data } = await db.from("job_templates").select(TEMPLATE_COLUMNS).order("updated_at", { ascending: false });
  return (data ?? []) as JobTemplate[];
}

export async function getMyTemplate(id: string): Promise<JobTemplate | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db.from("job_templates").select(TEMPLATE_COLUMNS).eq("id", id).maybeSingle();
  return (data as JobTemplate | null) ?? null;
}
