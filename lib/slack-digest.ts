import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notifySlack } from "@/lib/notify-slack";
import { digestMessage, siteLabel, type DigestNumbers } from "@/lib/slack-text";

// The morning summary for Slack, sent by the daily job. Counts only (no names or addresses). A number that cannot be read, because a table is
// missing on a database that has not had its SQL yet, counts as 0, so the summary still goes out.
async function count(db: SupabaseClient, table: string, apply: (q: any) => any = (q) => q): Promise<number> { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const { count: n, error } = await apply(db.from(table).select("id", { count: "exact", head: true }));
    return error ? 0 : (n ?? 0);
  } catch {
    return 0;
  }
}

export async function gatherDigest(db: SupabaseClient, now: Date = new Date()): Promise<DigestNumbers> {
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const [liveJobs, waitingForReview, openReports, newClinics, newCandidates, newApplications, newWaitlist] = await Promise.all([
    count(db, "jobs", (q) => q.eq("status", "live")),
    count(db, "jobs", (q) => q.eq("status", "in_review")),
    count(db, "job_reports", (q) => q.eq("status", "open")),
    count(db, "profiles", (q) => q.eq("role", "clinic").gte("created_at", since)),
    count(db, "profiles", (q) => q.eq("role", "candidate").gte("created_at", since)),
    count(db, "applications", (q) => q.gte("created_at", since)),
    count(db, "waitlist", (q) => q.gte("created_at", since)),
  ]);
  let paymentsToday = 0;
  let paidTodayCents = 0;
  let paidTotalCents = 0;
  try {
    const { data } = await db.from("job_payments").select("amount_cents, charged_at").eq("status", "charged");
    for (const row of data ?? []) {
      paidTotalCents += row.amount_cents;
      if (row.charged_at && row.charged_at >= since) {
        paymentsToday += 1;
        paidTodayCents += row.amount_cents;
      }
    }
  } catch {
    // no payments table yet
  }
  return { liveJobs, waitingForReview, openReports, newClinics, newCandidates, newApplications, newWaitlist, paymentsToday, paidTodayCents, paidTotalCents };
}

export async function sendDailyDigest(db: SupabaseClient): Promise<void> {
  const numbers = await gatherDigest(db);
  // notifySlack adds the site label itself, so the text sent here is the body only.
  const body = digestMessage(siteLabel(process.env), numbers).split("\n").slice(1);
  await notifySlack("Daily summary", body);
}
