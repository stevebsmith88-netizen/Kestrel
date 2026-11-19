import "server-only";
import { buildInsights, type InsightsInput } from "@/lib/insights";
import { supabaseAdmin } from "@/lib/supabase-server";

async function all<T>(table: string, columns: string): Promise<T[] | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const rows: T[] = [];
  for (let from = 0; from < 30000; from += 1000) {
    const { data, error } = await db.from(table).select(columns).range(from, from + 999);
    if (error || !data) return null;
    rows.push(...(data as T[]));
    if (data.length < 1000) break;
  }
  return rows;
}

// Worked out from the database for the admin Insights page and its spreadsheet. Totals only.
export async function loadInsights() {
  const [candidates, employers, jobs] = await Promise.all([
    all<InsightsInput["candidates"][number]>("candidate_profiles", "profession, home_province"),
    all<InsightsInput["employers"][number]>("employers", "id, practice_type, owner_id"),
    all<InsightsInput["jobs"][number]>("jobs", "employer_id, role_category, province, pay_period, pay_min, pay_max, is_seeded, status, posted_at"),
  ]);
  if (!candidates || !employers || !jobs) return null;
  return buildInsights({ candidates, employers, jobs });
}
