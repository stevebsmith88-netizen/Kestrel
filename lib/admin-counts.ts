import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { AdminCounts } from "@/lib/admin-menu";
import { NO_COUNTS } from "@/lib/admin-menu";

// What is waiting for Steve, for the badges in the admin menu: jobs in review, open support requests, claims waiting and open job reports.
// 4 small counts, no rows. Any count that fails shows as 0, so the menu never breaks the page.
export async function loadAdminCounts(): Promise<AdminCounts> {
  const db = supabaseAdmin();
  if (!db) return NO_COUNTS;
  const count = async (table: string, column: string, value: string) => {
    try {
      const { count: n } = await db.from(table).select("id", { count: "exact", head: true }).eq(column, value);
      return n ?? 0;
    } catch {
      return 0;
    }
  };
  const [review, support, claims, reports] = await Promise.all([
    count("jobs", "status", "in_review"),
    count("support_requests", "status", "open"),
    count("listing_claims", "status", "pending_review"),
    count("job_reports", "status", "open"),
  ]);
  return { review, support, claims, reports };
}
