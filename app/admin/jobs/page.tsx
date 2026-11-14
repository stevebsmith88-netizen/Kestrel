import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import AdminJobCard, { type AdminJob } from "@/components/AdminJobCard";
import { requireRole } from "@/lib/auth";
import { loadActivity } from "@/lib/job-activity";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Jobs | Admin | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Row = AdminJob;
type Payment = { job_id: string; status: string; amount_cents: number; band: string; failure_message: string | null };

// Admin, Jobs (Steve, 14th November 2026): the 60 jobs that changed most recently, each with its payment and a closed Activity box showing
// what happened to it and when (sent, card saved, approved, charged, refused and why, live). Drafts are left out.
export default async function AdminJobs() {
  const session = await requireRole("admin");
  const db = supabaseAdmin();
  const { data } = db
    ? await db.from("jobs").select("id, title, status, role_category, city, province, posted_at, expires_at, updated_at, employers(clinic_name)").neq("status", "draft").order("updated_at", { ascending: false }).limit(60)
    : { data: null };
  const jobs = (data ?? []) as unknown as Row[];
  const ids = jobs.map((j) => j.id);
  const activity = db ? await loadActivity(db, ids) : new Map();
  const payments = new Map<string, Payment>();
  if (db && ids.length) {
    const { data: rows } = await db.from("job_payments").select("job_id, status, amount_cents, band, failure_message, created_at").in("job_id", ids).order("created_at", { ascending: false });
    ((rows ?? []) as Payment[]).forEach((r) => !payments.has(r.job_id) && payments.set(r.job_id, r));
  }
  return (
    <>
      <AppBar session={session} current="/admin" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="back"><Link href="/admin">Back to the overview</Link></p>
          <h1>Jobs</h1>
          <p className="lede2">The jobs that changed most recently, with their payment and what happened to each. Open Activity under a job to read its notes.</p>
          {jobs.length === 0 ? (
            <section className="card"><p>No jobs yet beyond drafts.</p></section>
          ) : (
            <div className="joblist">
              {jobs.map((j) => <AdminJobCard key={j.id} job={j} payment={payments.get(j.id)} activity={activity.get(j.id) ?? []} />)}
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
