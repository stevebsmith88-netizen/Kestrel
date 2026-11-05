import "server-only";
import { ownPayStats, type OwnPayStat, type PostedPayRow } from "@/lib/pay-benchmark";
import { supabaseAdmin } from "@/lib/supabase-server";

// Kestrel's own posted pay, as totals only (never one clinic's figures), for the pay guide on the post a job form.
// Counts jobs a clinic posted and Kestrel approved (live, closed or expired). Jobs found on a clinic's own careers page (is_seeded)
// and drafts are left out. Returns nothing if the database is not set up, and the form then falls back to Job Bank figures.
export async function loadOwnPayStats(): Promise<OwnPayStat[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const rows: PostedPayRow[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await db
      .from("jobs")
      .select("employer_id, role_category, province, pay_period, pay_min, pay_max")
      .in("status", ["live", "closed", "expired"])
      .eq("is_seeded", false)
      .not("posted_at", "is", null)
      .range(from, from + 999);
    if (error || !data) return [];
    rows.push(...(data as PostedPayRow[]));
    if (data.length < 1000) break;
  }
  return ownPayStats(rows);
}
