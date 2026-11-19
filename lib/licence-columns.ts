import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

// The registration number columns (migration 0056) are read and written only once the database has them, so every page keeps working on a
// database that has not had the SQL yet. The answer is remembered: for good once the columns are there, and for 5 minutes while they are not.
const state = { ready: false, at: 0 };

export async function licenceReady() {
  if (state.ready || Date.now() - state.at < 5 * 60 * 1000) return state.ready;
  state.at = Date.now();
  const admin = supabaseAdmin();
  if (!admin) return false;
  const { error } = await admin.from("candidate_profiles").select("licence_number").limit(1);
  state.ready = !error;
  return state.ready;
}

export const LICENCE_SELECT = "licence_province, licence_number, licence_does, licence_not_yet";

// ", licence_province, ..." once the database has them, otherwise nothing.
export async function withLicence(columns: string) {
  return (await licenceReady()) ? `${columns}, ${LICENCE_SELECT}` : columns;
}
