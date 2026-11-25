import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dailyBudget, warnAt } from "@/lib/send-budget";
import { supabaseAdmin } from "@/lib/supabase-server";

// The shared count of emails the website sends each day (audit P1-24, migration 0042). Never throws, and does nothing harmful on a
// database without the migration: the count is simply not kept, and the daily job uses its whole budget as before.

const TORONTO_DAY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// Adds 1 after an email is sent. On the send that takes the day's total to 80% of DAILY_EMAIL_BUDGET, Steve is emailed, once a day.
export async function countSend() {
  const db = supabaseAdmin();
  if (!db) return;
  const budget = dailyBudget();
  const { data, error } = await db.rpc("count_email_send", { budget });
  if (error) {
    if (!/count_email_send|PGRST202|42883/.test(`${error.code} ${error.message}`)) console.error("Counting an email failed:", error.code, error.message);
    return;
  }
  const result = data as { sent?: number; warn?: boolean } | null;
  if (result?.warn) {
    // Imported here, not at the top, because notifyAdmin sends an email itself, which comes back through this count.
    const { notifyAdmin } = await import("@/lib/notify-admin");
    await notifyAdmin("Kestrel is close to today's email limit", [
      `The website has sent ${result.sent ?? warnAt(budget)} emails today, which is ${warnAt(budget)} or more of the ${budget} set in DAILY_EMAIL_BUDGET.`,
      "Emails people trigger (new applications, a clinic declining several applicants) still go. The daily job will hold back job alerts and reminders until tomorrow once the budget is used.",
      "If this happens often, it is time to look at Resend's paid plan and then raise DAILY_EMAIL_BUDGET (docs/settings.md).",
    ]);
  }
}

// How many emails have gone today, or null if the count cannot be read (for example, before migration 0042).
export async function emailsSentToday(db: SupabaseClient): Promise<number | null> {
  const { data, error } = await db.from("email_send_counts").select("sent").eq("day", TORONTO_DAY()).maybeSingle();
  if (error) return null;
  return Number(data?.sent ?? 0);
}
