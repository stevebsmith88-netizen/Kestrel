import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import BulkApplicantPanel from "@/components/BulkApplicantPanel";
import { AppStatusBadge } from "@/components/AppStatus";
import { requireRole } from "@/lib/auth";
import { GROUP_LABELS, groupOf, type Group } from "@/lib/applications";
import { declineSelected, fillRole, interviewSelected, shortlistSelected } from "@/lib/applicant-actions";
import { RESPONSE_NOTE } from "@/lib/clinic-emails";
import { getMyJob } from "@/lib/clinic";
import { FILL_SOURCES } from "@/lib/job-ending";
import { longDate } from "@/lib/jobs";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Applicants | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WAITING = ["applied", "viewed", "shortlisted"];
const FILTERS: (Group | "all")[] = ["all", "review", "interview", "offer", "closed"];

type Row = { id: string; status: string; created_at: string; cover_letter: string | null; applicant: { name?: string; profession?: string | null; years_experience?: string | null; licensed_provinces?: string[] } };

// What the page says after a bulk action, and why one could not be done. The wording is fixed here, never taken from the address.
const BULK_ERRORS: Record<string, string> = {
  none: "Tick at least one applicant first.",
  message: "Write your interview invitation first. Include the date, time and how to join. Everyone you tick gets the same message.",
  brackets: "Please replace the square brackets in your message with the real details before sending.",
};

export default async function Applicants({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ filter?: string; sent?: string; filled?: string; moved?: string; n?: string; skipped?: string; bulkerror?: string }> }) {
  const session = await requireRole("clinic");
  const { id } = await params;
  const { filter, sent, filled, moved, n, skipped, bulkerror } = await searchParams;
  const movedCount = Number.parseInt(n ?? "", 10);
  const skippedCount = Number.parseInt(skipped ?? "", 10);
  if (!UUID.test(id)) notFound();
  const job = await getMyJob(id);
  if (!job) notFound();
  const db = await supabaseServer();
  const { data } = db
    ? await db.from("applications").select("id, status, created_at, cover_letter, applicant").eq("job_id", id).order("created_at", { ascending: false })
    : { data: null };
  const rows = (data ?? []) as Row[];
  const active: Group | "all" = (FILTERS as string[]).includes(filter ?? "") ? (filter as Group | "all") : "all";
  const count = (f: Group | "all") => (f === "all" ? rows.length : rows.filter((r) => groupOf(r.status) === f).length);
  const waiting = rows.filter((r) => WAITING.includes(r.status));
  const sentCount = Number.parseInt(sent ?? "", 10);
  const shown = active === "all" ? rows : rows.filter((r) => groupOf(r.status) === active);
  // When any row has a tick box, every row gets the tick box column, so the names line up down the page.
  const anyTick = shown.some((r) => WAITING.includes(r.status));

  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="back"><Link href="/clinic">Back to your dashboard</Link></p>
          <p className="kicker">Applicants</p>
          <h1>{job.title}</h1>
          <p className="lede2">{rows.length} {rows.length === 1 ? "applicant" : "applicants"}. Open an application to read their cover letter and CV, and to let them know where they stand.</p>

          {Number.isFinite(sentCount) && (
            <p className="ok-msg" role="status">
              {filled ? "Marked as filled. " : ""}{sentCount === 0 ? "Nobody was waiting, so no messages were sent." : `${sentCount} ${sentCount === 1 ? "candidate has" : "candidates have"} been told, kindly, and can see it in their account.`}
            </p>
          )}
          {bulkerror && BULK_ERRORS[bulkerror] && <p className="notice warn" role="alert">{BULK_ERRORS[bulkerror]}</p>}
          {(moved === "shortlisted" || moved === "interview") && Number.isFinite(movedCount) && (
            <p className="ok-msg" role="status">
              {movedCount === 0
                ? "Nobody was moved."
                : moved === "shortlisted"
                  ? `${movedCount} ${movedCount === 1 ? "applicant is" : "applicants are"} now shortlisted. No email was sent.`
                  : `${movedCount} ${movedCount === 1 ? "applicant has" : "applicants have"} been invited to interview, by email and in their account.`}
              {Number.isFinite(skippedCount) && skippedCount > 0 ? ` ${skippedCount} ${skippedCount === 1 ? "was" : "were"} left as they were, because they were already at that step or had withdrawn.` : ""}
            </p>
          )}
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
                    <h3><Link href={`/clinic/applications/${r.id}`}>{r.applicant.name ?? "Applicant"}</Link></h3>
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
              <BulkApplicantPanel shortlist={shortlistSelected} interview={interviewSelected} />
            )}
            </form>
          )}

          {waiting.length > 0 && job.status === "live" && (
            <form action={fillRole} className="card bulkfill">
              <input type="hidden" name="jobId" value={id} />
              <h2>Role filled?</h2>
              <p className="help">This closes the job and lets the {waiting.length} {waiting.length === 1 ? "person" : "people"} still waiting know it has been filled. Candidates in an interview or with an offer are not changed.</p>
              <div className="row">
                <label className="lab" htmlFor="filledVia">How did you find the person?</label>
                <select id="filledVia" name="filledVia" defaultValue="">
                  <option value="">Choose one (optional)</option>
                  {FILL_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <label className="consent"><input type="checkbox" name="confirm" value="yes" required /><span>Yes, close this job and tell everyone who is waiting.</span></label>
              <div><button type="submit" className="btn sm">The role is filled</button></div>
            </form>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
