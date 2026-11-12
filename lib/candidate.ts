import "server-only";
import { readyToApply } from "./profile-ready.ts";
import { viewApplication, viewForCandidate, type HistoryEvent } from "./application-view.ts";
import type { PrefsRow } from "@/lib/candidate-prefs";
import { supabaseServer } from "@/lib/supabase/server";

export type CandidateProfile = PrefsRow & {
  profession: string | null;
  licensed_provinces: string[];
  years_experience: string | null;
  available_from: string | null;
  phone: string | null;
  cv_path: string | null;
  cv_filename: string | null;
  cv_uploaded_at: string | null;
};

export type Application = {
  id: string;
  job_id: string;
  status: string;
  cover_letter: string | null;
  keep_details: boolean;
  job_title: string;
  clinic_name: string;
  job_location: string;
  cv_filename: string | null;
  clinic_message: string | null;
  viewed_at: string | null;
  status_changed_at: string;
  created_at: string;
  applicant: { name?: string; email?: string; phone?: string | null; profession?: string | null; licensed_provinces?: string[]; years_experience?: string | null; available_from?: string | null };
};

export const APPLICATION_COLUMNS =
  "id, job_id, status, cover_letter, keep_details, job_title, clinic_name, job_location, cv_filename, clinic_message, viewed_at, status_changed_at, created_at, applicant";

// The signed in candidate's own profile (row level security means only their own).
export async function getMyCandidateProfile(userId: string): Promise<CandidateProfile | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db
    .from("candidate_profiles")
    .select("profession, licensed_provinces, years_experience, available_from, phone, cv_path, cv_filename, cv_uploaded_at, home_city, home_province, pref_radius_km, pref_provinces, pref_employment_types, pref_other_roles, pref_min_pay, pref_pay_period, pref_practice, software_skills")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as CandidateProfile | null) ?? null;
}

// Whether to send a candidate to the first step page: they have no role yet and have not been shown it. If the database has not had migration 0037
// yet the read fails, and nobody is sent there, so the site keeps working until the SQL has been run.
export async function needsFirstStep(userId: string, profile: CandidateProfile | null): Promise<boolean> {
  if (profile?.profession) return false;
  const db = await supabaseServer();
  if (!db) return false;
  const { data, error } = await db.from("candidate_profiles").select("start_seen_at").eq("user_id", userId).maybeSingle();
  if (error) return false;
  return !data?.start_seen_at;
}

export async function getMyApplications(): Promise<Application[]> {
  const db = await supabaseServer();
  if (!db) return [];
  const { data } = await db.from("applications").select(APPLICATION_COLUMNS).order("created_at", { ascending: false });
  return ((data ?? []) as Application[]).map(viewForCandidate);
}

type LoadedApplication = { application: Application; history: HistoryEvent[] };

// One application and its history, as the given reader should see it. The database only returns it if the reader may see it
// (the candidate's own, or one to a job of the clinic's own). The rules for what each reader sees are in lib/application-view.ts.
async function loadApplication(id: string, audience: "candidate" | "clinic"): Promise<LoadedApplication | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db.from("applications").select(APPLICATION_COLUMNS).eq("id", id).maybeSingle();
  if (!data) return null;
  const { data: events } = await db.from("application_events").select("status, note, created_at").eq("application_id", id).order("created_at", { ascending: true });
  return viewApplication(data as Application, events ?? [], audience);
}

// For the candidate's pages: "Shortlisted" is shown as "Viewed".
export const getApplication = (id: string) => loadApplication(id, "candidate");

// For the clinic's application page: the real status and the real history, shortlist step included.
export const getApplicationForClinic = (id: string) => loadApplication(id, "clinic");

// A profile is ready to apply with once it has a resume and the basics.
export function profileReady(p: CandidateProfile | null) {
  return readyToApply(p);
}

export function profileStrength(p: CandidateProfile | null) {
  if (!p) return 0;
  const parts = [p.profession, p.licensed_provinces.length > 0, p.years_experience, p.available_from, p.cv_path];
  return Math.round((parts.filter(Boolean).length / parts.length) * 100);
}
