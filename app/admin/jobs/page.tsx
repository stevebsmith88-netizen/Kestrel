import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { type AdminJob } from "@/components/admin-job-types";
import AdminJobRow from "@/components/AdminJobRow";
import { requireRole } from "@/lib/auth";
import { JOBS_PAGE_SIZE, JOB_STATUS_FILTERS, filtersInUse, jobsHref, pageRange, parseJobsQuery } from "@/lib/admin-jobs-filter";
import { loadActivity } from "@/lib/job-activity";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Jobs | Admin | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Row = AdminJob;
type Payment = { job_id: string; status: string; amount_cents: number; band: string; failure_message: string | null };

const COLUMNS = "id, title, status, role_category, city, province, posted_at, expires_at, updated_at, employers(clinic_name)";

// Admin, Jobs (Steve, 14th November 2026): the full record of every job except drafts. Search by job title or clinic, choose a state, sort
// newest or oldest, 25 to a page. Each job is one line that opens to its payment and Activity. The review queue is for deciding, this page is for finding.
export default async function AdminJobs({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; order?: string; page?: string }> }) {
  const session = await requireRole("admin");
  const query = parseJobsQuery(await searchParams);
  const db = supabaseAdmin();
  let rows: Row[] = [];
  let total = 0;
  if (db) {
    let request = db.from("jobs").select(COLUMNS, { count: "exact" }).neq("status", "draft");
    if (query.status !== "all") request = request.eq("status", query.status);
    if (query.q) {
      // A search matches the job title or the clinic's name. The clinics that match are found first, then their jobs.
      const { data: clinics } = await db.from("employers").select("id").ilike("clinic_name", `%${query.q}%`).limit(200);
      const ids = (clinics ?? []).map((c) => c.id);
      request = request.or([`title.ilike.%${query.q}%`, ...(ids.length ? [`employer_id.in.(${ids.join(",")})`] : [])].join(","));
    }
    const { from, to } = pageRange(query.page);
    const { data, count } = await request.order("updated_at", { ascending: query.order === "oldest" }).range(from, to);
    rows = (data ?? []) as unknown as Row[];
    total = count ?? rows.length;
  }
  const ids = rows.map((j) => j.id);
  const activity = db ? await loadActivity(db, ids) : new Map();
  const payments = new Map<string, Payment>();
  if (db && ids.length) {
    const { data: pay } = await db.from("job_payments").select("job_id, status, amount_cents, band, failure_message, created_at").in("job_id", ids).order("created_at", { ascending: false });
    ((pay ?? []) as Payment[]).forEach((r) => !payments.has(r.job_id) && payments.set(r.job_id, r));
  }
  const pages = Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE));
  const first = total === 0 ? 0 : (query.page - 1) * JOBS_PAGE_SIZE + 1;
  const last = Math.min(total, query.page * JOBS_PAGE_SIZE);
  return (
    <>
      <AppBar session={session} current="/admin" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="back"><Link href="/admin">Back to the overview</Link></p>
          <h1>Jobs</h1>
          <p className="lede2">Every job, whatever happened to it. Press a job to see its payment and notes. Jobs waiting for a decision are in the review queue.</p>
          <p><Link href="/admin/review" className="btn sm ghost">Go to the review queue</Link></p>

          <form method="get" action="/admin/jobs" className="jobfilter" role="search">
            <div className="row grow">
              <label className="lab" htmlFor="jf-q">Job title or clinic</label>
              <input id="jf-q" name="q" type="text" enterKeyHint="search" autoComplete="off" defaultValue={query.q} maxLength={60} />
            </div>
            <div className="row">
              <label className="lab" htmlFor="jf-status">Show</label>
              <select id="jf-status" name="status" defaultValue={query.status}>
                {JOB_STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="row">
              <label className="lab" htmlFor="jf-order">Order</label>
              <select id="jf-order" name="order" defaultValue={query.order}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
            <div className="row"><button type="submit" className="btn sm">Search</button></div>
            {filtersInUse(query) && <div className="row"><Link href="/admin/jobs" className="btn sm ghost">Clear</Link></div>}
          </form>

          {rows.length === 0 ? (
            <section className="card"><p>{filtersInUse(query) ? "No jobs match that search." : "No jobs yet beyond drafts."}</p></section>
          ) : (
            <>
              <p className="help" role="status">Showing {first} to {last} of {total}.</p>
              <div className="joblist">
                {rows.map((j) => <AdminJobRow key={j.id} job={j} payment={payments.get(j.id)} activity={activity.get(j.id) ?? []} />)}
              </div>
              {pages > 1 && (
                <nav className="jobpager" aria-label="Pages of jobs">
                  {query.page > 1 ? <Link href={jobsHref(query, query.page - 1)} className="btn sm ghost">Previous</Link> : <span />}
                  <p className="help">Page {query.page} of {pages}</p>
                  {query.page < pages ? <Link href={jobsHref(query, query.page + 1)} className="btn sm ghost">Next</Link> : <span />}
                </nav>
              )}
            </>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
