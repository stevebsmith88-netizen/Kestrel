import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import BulkApplicantPanel from "@/components/BulkApplicantPanel";
import FilledViaFields from "@/components/FilledViaFields";
import ToastHost from "@/components/ToastHost";
import { AppStatusBadge } from "@/components/AppStatus";
import { requireRole } from "@/lib/auth";
import { GROUP_LABELS } from "@/lib/applications";
import { FILTERS, WAITING, loadApplicants } from "@/lib/applicant-list";
import { declineSelected, declineSelectedQuiet, fillRole, interviewSelectedQuiet, shortlistSelectedQuiet } from "@/lib/applicant-actions";
import { BULK_PROBLEMS, declinedText } from "@/lib/bulk-notices";
import { RESPONSE_NOTE } from "@/lib/clinic-emails";
import { getMyJob } from "@/lib/clinic";
import { FILL_SOURCES } from "@/lib/job-ending";
import { longDate } from "@/lib/jobs";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Applicants | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


export default async function Applicants({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ filter?: string; sent?: string; filled?: string; bulkerror?: string }> }) {
  const session = await requireRole("clinic");
  const { id } = await params;
  const { filter, sent, filled, bulkerror } = await searchParams;
  if (!UUID.test(id)) notFound();
  const job = await getMyJob(id);
  if (!job) notFound();
  const { rows, active, shown, count, waiting, hireCandidates, talking, clinicName, anyTick } = await loadApplicants(await supabaseServer(), id, filter);
  const sentCount = Number.parseInt(sent ?? "", 10);

  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="back"><Link href="/clinic">Back to your dashboard</Link></p>
          <p className="kicker">Applicants</p>
          <h1>{job.title}</h1>
          <p className="lede2">{rows.length} {rows.length === 1 ? "applicant" : "applicants"}. Open an application to read their cover letter and resume, and to let them know where they stand.</p>

          {Number.isFinite(sentCount) && (
            <p className="ok-msg" role="status">{filled ? "Marked as filled. " : ""}{declinedText(sentCount)}</p>
          )}
          {bulkerror && BULK_PROBLEMS[bulkerror] && <p className="notice warn" role="alert">{BULK_PROBLEMS[bulkerror]}</p>}
          {waiting.length > 0 && <p className="replynote">{waiting.length} {waiting.length === 1 ? "applicant is" : "applicants are"} waiting for a reply. {RESPONSE_NOTE}</p>}

          <nav className="tabs" aria-label="Filter applicants">
            {FILTERS.map((f) => (
              <Link key={f} href={f === "all" ? `/clinic/jobs/${id}/applicants` : `/clinic/jobs/${id}/applicants?filter=${f}`} className={`tab ${active === f ? "on" : ""}`} aria-current={active === f ? "page" : undefined}>
                {f === "all" ? "All" : GROUP_LABELS[f]} ({count(f)})
              </Link>
            ))}
          </nav>

          {shown.length === 0 ? (
            <section className="card emptystate"><h2>{rows.length === 0 ? "No applicants yet" : "Nothing here"}</h2><p>{rows.length === 0 ? "When someone applies, they appear here and we email you." : "Try another tab."}</p></section>
          ) : (
            <form action={declineSelected}>
            <input type="hidden" name="jobId" value={id} />
            <div className="joblist">
              {shown.map((r) => (
                <article className={`card jobrow${anyTick ? " withtick" : ""}`} key={r.id}>
                  {WAITING.includes(r.status) ? (
                    <label className="rowtick"><input type="checkbox" name="ids" value={r.id} /><span className="sr">Select {r.applicant.name ?? "this applicant"}</span></label>
                  ) : (
                    anyTick && <span aria-hidden="true" />
                  )}
                  <div className="jobmain">
                    <h2><Link href={`/clinic/applications/${r.id}`}>{r.applicant.name ?? "Applicant"}</Link></h2>
                    <p className="meta">{[r.applicant.profession, r.applicant.years_experience, r.applicant.licensed_provinces?.length ? `Licensed in ${r.applicant.licensed_provinces.join(", ")}` : null].filter(Boolean).join(" · ")}</p>
                    <p className="meta">Applied {longDate(r.created_at)} · {r.cover_letter ? "Includes a cover letter" : "No cover letter"}</p>
                  </div>
                  <div className="jobside">
                    <AppStatusBadge status={r.status} />
                    <Link href={`/clinic/applications/${r.id}`} className="btn sm">Open</Link>
                  </div>
                </article>
              ))}
            </div>
            {shown.some((r) => WAITING.includes(r.status)) && (
              <BulkApplicantPanel shortlist={shortlistSelectedQuiet} interview={interviewSelectedQuiet} decline={declineSelectedQuiet} />
            )}
            </form>
          )}

          {(waiting.length > 0 || talking.length > 0) && job.status === "live" && (
            <form action={fillRole} className="card bulkfill">
              <input type="hidden" name="jobId" value={id} />
              <h2>Role filled?</h2>
              <p className="help">This closes the job{waiting.length > 0 ? ` and lets the ${waiting.length} ${waiting.length === 1 ? "person" : "people"} still waiting know it has been filled` : ""}.{talking.length > 0 ? " The people you are still talking to are listed below, each with a message you can edit." : ""}</p>
              <FilledViaFields sources={FILL_SOURCES} candidates={hireCandidates} idPrefix="ap" talking={talking} clinicName={clinicName} />
              <label className="consent"><input type="checkbox" name="confirm" value="yes" required /><span>Yes, close this job and tell everyone listed.</span></label>
              <div><button type="submit" className="btn sm">The role is filled</button></div>
            </form>
          )}
        </div>
      </main>
      <ToastHost />
      <AppFooter />
    </>
  );
}
