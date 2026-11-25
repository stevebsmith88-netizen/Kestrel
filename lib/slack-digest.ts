import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notifySlack } from "@/lib/notify-slack";
import { digestMessage, siteLabel, type DigestNumbers } from "@/lib/slack-text";
import { overdue, reminderLines } from "@/lib/support-reminders";

// The morning summary for Slack, sent by the daily job. Counts only (no names or addresses). A number that cannot be read, because a table is
// missing on a database that has not had its SQL yet, counts as 0, so the summary still goes out.
export async function countRows(db: SupabaseClient, table: string, apply: (q: any) => any = (q) => q): Promise<number> { // eslint-disable-line @typescript-eslint/no-explicit-any
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
    countRows(db, "jobs", (q) => q.eq("status", "live")),
    countRows(db, "jobs", (q) => q.eq("status", "in_review")),
    countRows(db, "job_reports", (q) => q.eq("status", "open")),
    countRows(db, "profiles", (q) => q.eq("role", "clinic").gte("created_at", since)),
    countRows(db, "profiles", (q) => q.eq("role", "candidate").gte("created_at", since)),
    countRows(db, "applications", (q) => q.gte("created_at", since)),
    countRows(db, "waitlist", (q) => q.gte("created_at", since)),
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
  await notifySlack("Daily summary", body, { path: "/admin", text: "Open the admin dashboard" }, "daily");
}

// A reminder for the Support channel when a support request or a reported job has waited more than 1 business day (next tasks item 19b). It says
// nothing when nothing is waiting. A table that cannot be read counts as nothing waiting.
export async function sendWaitingReminder(db: SupabaseClient, now: Date = new Date()): Promise<void> {
  const waiting = async (table: string) => {
    try {
      const { data, error } = await db.from(table).select("created_at").eq("status", "open").limit(500);
      return error ? 0 : (data ?? []).filter((r: { created_at: string }) => overdue(r.created_at, now)).length;
    } catch {
      return 0;
    }
  };
  const [support, reports] = await Promise.all([waiting("support_requests"), waiting("job_reports")]);
  const lines = reminderLines(support, reports);
  if (lines.length === 0) return;
  await notifySlack("Waiting for you", lines, { path: support > 0 ? "/admin/requests" : "/admin/reports", text: support > 0 ? "Open support" : "Open the reports" }, "support");
}
