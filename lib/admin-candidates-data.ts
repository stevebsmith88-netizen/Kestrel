import "server-only";
import { buildCandidateRows, type CandidateSource } from "@/lib/admin-candidates";
import { loadAccountEmails } from "@/lib/account-emails";
import { supabaseAdmin } from "@/lib/supabase-server";

async function all<T>(table: string, columns: string, role?: string): Promise<T[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const rows: T[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const base = db.from(table).select(columns);
    const { data, error } = await (role ? base.eq("role", role) : base).range(from, from + 999);
    if (error || !data) break;
    rows.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return rows;
}

// Every candidate account except the demo accounts, newest first. Names, places and counts only: never a resume or what an application says.
export async function loadCandidates() {
  const db = supabaseAdmin();
  if (!db) return null;
  const emails = await loadAccountEmails(db);
  const [profiles, candidateProfiles, applications] = await Promise.all([
    all<CandidateSource["profiles"][number]>("profiles", "id, full_name, created_at", "candidate"),
    all<CandidateSource["candidateProfiles"][number]>("candidate_profiles", "user_id, profession, home_city, home_province, cv_path"),
    all<CandidateSource["applications"][number]>("applications", "candidate_id"),
  ]);
  return buildCandidateRows({ profiles, emails, candidateProfiles, applications });
}
