import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

// The social link columns (migration 0054) are read and written only once the database has them, so every page keeps working on a database
// that has not had the SQL yet. Each answer is remembered: for good once the columns are there, and for 5 minutes while they are not.
const state = {
  clinic: { ready: false, at: 0 },
  candidate: { ready: false, at: 0 },
};

async function check(which: "clinic" | "candidate", table: string, column: string) {
  const s = state[which];
  if (s.ready || Date.now() - s.at < 5 * 60 * 1000) return s.ready;
  s.at = Date.now();
  const admin = supabaseAdmin();
  if (!admin) return false;
  const { error } = await admin.from(table).select(column).limit(1);
  s.ready = !error;
  return s.ready;
}

export const clinicSocialReady = () => check("clinic", "employers", "social_linkedin");
export const candidateLinkedinReady = () => check("candidate", "candidate_profiles", "linkedin_url");

export const CLINIC_SOCIAL_SELECT = "social_instagram, social_facebook, social_linkedin";

// ", social_instagram, social_facebook, social_linkedin" once the database has them, otherwise nothing.
export async function withClinicSocial(columns: string) {
  return (await clinicSocialReady()) ? `${columns}, ${CLINIC_SOCIAL_SELECT}` : columns;
}
export async function withCandidateLinkedin(columns: string) {
  return (await candidateLinkedinReady()) ? `${columns}, linkedin_url` : columns;
}
