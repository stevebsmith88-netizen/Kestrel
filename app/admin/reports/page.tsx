import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { dismissReport, takeDownReportedJob } from "@/lib/admin-actions";
import { longDate } from "@/lib/jobs";
import { REPORT_REASON_LABEL } from "@/lib/reports";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Reports | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  removed: "The job has been taken down and the clinic has been told.",
  dismissed: "Report dismissed.",
  error: "That didn't work. The report may already have been handled. Please refresh and try again.",
};

type Report = {
  id: string; job_id: string; reason: string; details: string | null; reporter_email: string | null; created_at: string;
  jobs: { title: string; status: string; city: string | null; province: string | null; employers: { clinic_name: string } | null } | null;
};

export default async function Reports({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("admin");
  const { notice } = await searchParams;
  const db = supabaseAdmin();
  const { data } = db
    ? await db
        .from("job_reports")
        .select("id, job_id, reason, details, reporter_email, created_at, jobs(title, status, city, province, employers(clinic_name))")
        .eq("status", "open")
        .order("created_at", { ascending: true })
    : { data: null };
  const reports = (data ?? []) as unknown as Report[];
  return (
    <>
      <AppBar session={session} current="/admin/reports" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Admin</p>
          <h1>Reported jobs</h1>
          <p className="lede2">Open reports from candidates and visitors. Taking a job down tells the clinic and closes every open report about that job.</p>
          {notice && NOTICES[notice] && <p className="notice" role="status">{NOTICES[notice]}</p>}
          {reports.length === 0 ? (
            <section className="card"><p>No open reports.</p></section>
          ) : (
            <div className="joblist">
              {reports.map((r) => (
                <article className="card review" key={r.id}>
                  <h2>{r.jobs?.title ?? "A job"}</h2>
                  <p className="meta">
                    {r.jobs?.employers?.clinic_name} · {r.jobs?.city}, {r.jobs?.province} · {r.jobs?.status === "live" ? "Live" : `Now ${r.jobs?.status}`} · reported {longDate(r.created_at)}
                  </p>
                  <div className="flags"><strong>{REPORT_REASON_LABEL[r.reason] ?? r.reason}</strong></div>
                  {r.details && <pre className="adtext">{r.details}</pre>}
                  {r.reporter_email && <p className="help">Reporter: <a href={`mailto:${r.reporter_email}`}>{r.reporter_email}</a></p>}
                  <p><Link href={`/jobs/${r.job_id}`}>Open the job</Link></p>
                  <div className="reviewbtns">
                    <form action={takeDownReportedJob}><input type="hidden" name="id" value={r.id} /><button type="submit" className="btn">Take the job down</button></form>
                    <form action={dismissReport}><input type="hidden" name="id" value={r.id} /><button type="submit" className="btn ghost">Dismiss this report</button></form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
