import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

// A clinic's payments, read with the clinic's own sign in. A clinic can read the status, amount and invoice links of its own payments, never
// Stripe ids (migrations 0048 and 0050). A database without those tables or columns gives less, so the pages still work.
export type JobPayment = { status: string; amount_cents: number; invoice_number?: string | null; invoice_url?: string | null; invoice_pdf_url?: string | null };

type Row = { job_id: string; status: string; amount_cents: number; created_at: string; invoice_number?: string | null; invoice_url?: string | null; invoice_pdf_url?: string | null };

async function readPayments(select: string, apply: (q: any) => any): Promise<Row[] | null> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const db = await supabaseServer();
  if (!db) return null;
  const { data, error } = await apply(db.from("job_payments").select(select));
  return error ? null : ((data ?? []) as Row[]);
}

// The latest payment for each job, for the tags on the dashboard.
export async function getMyJobPayments(jobIds: string[]): Promise<Record<string, JobPayment>> {
  const out: Record<string, JobPayment> = {};
  if (!jobIds.length) return out;
  const apply = (q: any) => q.in("job_id", jobIds).order("created_at", { ascending: false }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const rows = (await readPayments("job_id, status, amount_cents, created_at, invoice_number, invoice_url, invoice_pdf_url", apply)) ?? (await readPayments("job_id, status, amount_cents, created_at", apply)) ?? [];
  for (const row of rows) {
    if (row.status === "cancelled" || out[row.job_id]) continue;
    out[row.job_id] = { status: row.status, amount_cents: row.amount_cents, invoice_number: row.invoice_number ?? null, invoice_url: row.invoice_url ?? null, invoice_pdf_url: row.invoice_pdf_url ?? null };
  }
  return out;
}

export type PaymentHistoryRow = JobPayment & { id: string; job_title: string; created_at: string; charged_at: string | null };

// Every payment for one location, newest first, for the Billing page.
export async function getMyPaymentHistory(employerId: string): Promise<PaymentHistoryRow[]> {
  const db = await supabaseServer();
  if (!db) return [];
  const columns = "id, job_title, status, amount_cents, created_at, charged_at";
  for (const select of [`${columns}, invoice_number, invoice_url, invoice_pdf_url`, columns]) {
    const { data, error } = await db.from("job_payments").select(select).eq("employer_id", employerId).neq("status", "cancelled").order("created_at", { ascending: false }).limit(200);
    if (!error) return (data ?? []) as unknown as PaymentHistoryRow[];
  }
  return [];
}
