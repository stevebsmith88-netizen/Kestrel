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
  status: JobStatus;
  review_note: string | null;
  posted_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const JOB_COLUMNS =
  "id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, status, review_note, posted_at, expires_at, created_at";

// The signed in clinic's own profile (row level security means it can only be their own).
export async function getMyEmployer(userId: string): Promise<Employer | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db
    .from("employers")
    .select("id, clinic_name, practice_type, website, province, city, about")
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

export async function getMyJob(id: string): Promise<MyJob | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db.from("jobs").select(JOB_COLUMNS).eq("id", id).maybeSingle();
  return (data as MyJob | null) ?? null;
}
