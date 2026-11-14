import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

// The latest payment for each of a clinic's jobs, read with the clinic's own sign in (a clinic can read the status of its own payments,
// never Stripe ids: migration 0048). A database without the payments table gives an empty list, so the dashboard still works.
export type JobPayment = { status: string; amount_cents: number };

export async function getMyJobPayments(jobIds: string[]): Promise<Record<string, JobPayment>> {
  const out: Record<string, JobPayment> = {};
  const db = await supabaseServer();
  if (!db || !jobIds.length) return out;
  const { data, error } = await db.from("job_payments").select("job_id, status, amount_cents, created_at").in("job_id", jobIds).order("created_at", { ascending: false });
  if (error) return out;
  for (const row of data ?? []) {
    if (row.status === "cancelled") continue;
    if (!out[row.job_id]) out[row.job_id] = { status: row.status, amount_cents: row.amount_cents };
  }
  return out;
}
