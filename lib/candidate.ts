import "server-only";
import { candidateHistory, candidateStatus } from "@/lib/applications";
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

export async function getMyApplications(): Promise<Application[]> {
  const db = await supabaseServer();
  if (!db) return [];
  const { data } = await db.from("applications").select(APPLICATION_COLUMNS).order("created_at", { ascending: false });
  return ((data ?? []) as Application[]).map(forCandidate);
}

// How an application looks to the candidate: "Shortlisted" is shown as "Viewed", and a message left over from an older shortlist is not shown.
function forCandidate(a: Application): Application {
  return a.status === "shortlisted" ? { ...a, status: candidateStatus(a.status), clinic_message: null } : a;
}

export async function getApplication(id: string): Promise<{ application: Application; history: { status: string; note: string | null; created_at: string }[] } | null> {
  const db = await supabaseServer();
  if (!db) return null;
  const { data } = await db.from("applications").select(APPLICATION_COLUMNS).eq("id", id).maybeSingle();
  if (!data) return null;
  const { data: events } = await db.from("application_events").select("status, note, created_at").eq("application_id", id).order("created_at", { ascending: true });
  return { application: forCandidate(data as Application), history: candidateHistory(events ?? []) };
}

// A profile is ready to apply with once it has a CV and the basics.
export function profileReady(p: CandidateProfile | null) {
  return Boolean(p?.cv_path && p.profession);
}

export function profileStrength(p: CandidateProfile | null) {
  if (!p) return 0;
  const parts = [p.profession, p.licensed_provinces.length > 0, p.years_experience, p.available_from, p.cv_path];
  return Math.round((parts.filter(Boolean).length / parts.length) * 100);
}
