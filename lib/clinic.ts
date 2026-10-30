import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { JobStatus } from "@/lib/jobs";

export type Employer = {
  id: string;
  clinic_name: string;
  practice_type: string;
  website: string | null;
  province: string;
  city: string;
  about: string | null;
  notify_email: string;
  direct_hire_confirmed_at: string | null;
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
  "id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, work_arrangement, territory, pay_extras, status, review_note, posted_at, expires_at, created_at";

// The signed in clinic's own profile (row level security means it can only be their own).
export async function getMyEmployer(userId: string): Promise<Employer | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db
    .from("employers")
    .select("id, clinic_name, practice_type, website, province, city, about, direct_hire_confirmed_at")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!data) return null;
  const { data: contact } = await db.from("employer_contacts").select("notify_email").eq("employer_id", data.id).maybeSingle();
  return { ...data, notify_email: contact?.notify_email ?? "" } as Employer;
}

export async function getMyJobs(employerId: string): Promise<MyJob[]> {
  const db = await supabaseServer();
  if (!db) return [];
  const { data } = await db.from("jobs").select(JOB_COLUMNS).eq("employer_id", employerId).order("created_at", { ascending: false });
  return (data ?? []) as MyJob[];
}

// How many people applied to each of this clinic's jobs, and how many are still unread.
export async function getApplicantCounts(): Promise<Record<string, { total: number; fresh: number }>> {
  const db = await supabaseServer();
  if (!db) return {};
  const { data } = await db.from("applications").select("job_id, status");
  const counts: Record<string, { total: number; fresh: number }> = {};
  (data ?? []).forEach((row) => {
    const c = (counts[row.job_id] ??= { total: 0, fresh: 0 });
    c.total += 1;
    if (row.status === "applied") c.fresh += 1;
  });
  return counts;
}

export async function getMyJob(id: string): Promise<MyJob | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db.from("jobs").select(JOB_COLUMNS).eq("id", id).maybeSingle();
  return (data as MyJob | null) ?? null;
}
