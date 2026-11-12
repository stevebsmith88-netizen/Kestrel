import "server-only";
import { readyToApply } from "./profile-ready.ts";
export { profileStrength } from "./profile-ready.ts";
import { loadApplicationWith, loadMyApplications, type Application } from "./application-loaders.ts";
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

export { APPLICATION_COLUMNS, type Application } from "./application-loaders.ts";

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
  return db ? loadMyApplications(db) : [];
}

// One application and its history, as the given reader should see it (lib/application-loaders.ts).
const loadApplication = async (id: string, audience: "candidate" | "clinic") => {
  const db = await supabaseServer();
  return db ? loadApplicationWith(db, id, audience) : null;
};

// For the candidate's pages: "Shortlisted" is shown as "Viewed".
export const getApplication = (id: string) => loadApplication(id, "candidate");

// For the clinic's application page: the real status and the real history, shortlist step included.
export const getApplicationForClinic = (id: string) => loadApplication(id, "clinic");

// A profile is ready to apply with once it has a resume and the basics.
export function profileReady(p: CandidateProfile | null) {
  return readyToApply(p);
}
