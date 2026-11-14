import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import QuickActionForm from "@/components/QuickActionForm";
import ToastHost from "@/components/ToastHost";
import Icon from "@/components/Icon";
import GettingStarted from "@/components/GettingStarted";
import StatusBadge from "@/components/StatusBadge";
import JobPaymentTag from "@/components/JobPaymentTag";
import { getMyJobPayments } from "@/lib/clinic-payments";
import { requireRole } from "@/lib/auth";
import { clinicSteps } from "@/lib/checklist";
import { RESPONSE_NOTE } from "@/lib/clinic-emails";
import { getApplicantCounts, getMyClinics, getMyEmployer, getMyJobs } from "@/lib/clinic";
import LocationPicker from "@/components/LocationPicker";
import { switchLocation } from "@/lib/location-actions";
import { canEdit, levelLabel, VIEW_ONLY_TEXT } from "@/lib/team";
import { numbersLine, sumNumbers } from "@/lib/job-stats";
import { getMyJobNumbers } from "@/lib/job-stats-data";
import { closeJobQuiet, deleteJobQuiet, dismissNoticesQuiet, extendJobQuiet, repostJob, withdrawJobQuiet } from "@/lib/clinic-actions";
import { DISMISS_COOKIE, foldApprovals, parseDismissed, visibleNotices } from "@/lib/notice-dismiss";
import { canExtend } from "@/lib/job-ending";
import { saveJobAsTemplateQuiet } from "@/lib/template-actions";
import { jobNotices } from "@/lib/clinic-notices";
import { DASHBOARD_NOTICES, noticeTone } from "@/lib/dashboard-notices";
import { SHOW_LABELS, filterJobs, newApplicantsHref, parseShow } from "@/lib/dashboard-filter";
import { daysLeft, employmentLabel, longDate } from "@/lib/jobs";
import { payBasisOf, payText } from "@/lib/job-pay";

export const metadata: Metadata = { title: "Your dashboard | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";


export default async function ClinicHome({ searchParams }: { searchParams: Promise<{ notice?: string; template?: string; show?: string }> }) {
  const session = await requireRole("clinic");
  const { notice, template, show: showParam } = await searchParams;
  const show = parseShow(showParam);
  const employer = await getMyEmployer(session.userId);
  // A clinic with no profile yet goes straight to setting it up (Steve, 13th November 2026): the dashboard has nothing to show until then.
  if (!employer) redirect("/clinic/profile");
  const jobs = employer ? await getMyJobs(employer.id) : [];
  const applicants = employer ? await getApplicantCounts() : {};
  const numbers = employer ? await getMyJobNumbers() : {};
  const payments = employer ? await getMyJobPayments(jobs.map((j) => j.id)) : {};
  const totals = sumNumbers(numbers);
  const unread = Object.values(applicants).reduce((sum, c) => sum + c.fresh, 0);
  const waiting = Object.values(applicants).reduce((sum, c) => sum + c.waiting, 0);
  const shown = filterJobs(jobs, show, applicants);
  const first = session.firstName || "there";
  // A "view only" team member sees the same dashboard without the buttons that change jobs (migration 0045).
  const editor = canEdit(employer.level);
  // Several locations (migration 0047): a picker, and a summary of every location so nothing is missed in the ones not open now.
  const clinics = await getMyClinics(session.userId);
  const others = clinics.length > 1 ? await Promise.all(clinics.map(async (c) => {
    const theirJobs = c.id === employer.id ? jobs : await getMyJobs(c.id);
    return { ...c, live: theirJobs.filter((j) => j.status === "live").length, fresh: theirJobs.reduce((n, j) => n + (applicants[j.id]?.fresh ?? 0), 0) };
  })) : [];
  const count = (s: string) => jobs.filter((j) => j.status === s).length;
  // The green approval messages a clinic has not cleared yet. A message about a change a clinic needs to make is never hidden.
  const notices = visibleNotices(jobNotices(jobs), parseDismissed((await cookies()).get(DISMISS_COOKIE)?.value));
  const approvals = notices.filter((n) => n.kind === "approved");
  const folded = foldApprovals(approvals);

  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="kicker">{employer ? employer.clinic_name : "Clinic dashboard"}</p>
          <h1>Welcome, {first}</h1>
          <LocationPicker clinics={clinics} current={employer.id} back="/clinic" />
          {employer.level !== "owner" && <p className="lede2">You are on the {employer.clinic_name} team ({levelLabel(employer.level).toLowerCase()}).{editor ? "" : ` ${VIEW_ONLY_TEXT}`}</p>}
          {notice && DASHBOARD_NOTICES[notice] && <p className={noticeTone(notice) === "warn" ? "notice warn" : "notice"} role="status">{DASHBOARD_NOTICES[notice]}{template === "failed" ? " We could not also save it as a template. Use Save as template on the job to try again." : template ? " It is also saved as a template for next time." : ""}</p>}

          {notices.map((n) =>
            n.kind === "approved" ? (folded.fold ? null : (
              <div className="notice noticerow" role="status" key={n.id + n.kind}>
                <p>{n.text}</p>
                <div className="noticeacts">
                  <Link href={`/jobs/${n.id}`} className="btn sm">See your job</Link>
                  <QuickActionForm action={dismissNoticesQuiet} ids={[n.id]} className="linkbtn" label={`Dismiss the message about ${n.title}`}><Icon name="close" />Dismiss</QuickActionForm>
                </div>
              </div>
            )) : (
              <div className="notice warn noticerow" role="status" key={n.id + n.kind}>
                <p>{n.text}</p>
                <div className="noticeacts">
                  <Link href={`/clinic/jobs/${n.id}`} className="btn sm ghost">Open it</Link>
                </div>
              </div>
            ),
          )}
          {folded.fold && (
            <div className="notice noticerow" role="status">
              <p>{folded.text}</p>
              <div className="noticeacts">
                <QuickActionForm action={dismissNoticesQuiet} ids={folded.ids} className="linkbtn" label="Dismiss all the messages about approved jobs"><Icon name="close" />Dismiss all</QuickActionForm>
              </div>
            </div>
          )}
          {approvals.length === 2 && (
            <div className="noticeclear">
              <QuickActionForm action={dismissNoticesQuiet} ids={approvals.map((n) => n.id)} className="linkbtn">Clear all {approvals.length} approval messages</QuickActionForm>
            </div>
          )}

          {!employer ? (
            <section className="card setup">
              <h2>Set up your clinic profile</h2>
              <p>Tell us about your clinic, and where to send applicant alerts. It takes about 2 minutes, and then you can post your first job.</p>
              <Link href="/clinic/profile" className="btn">Create my clinic profile</Link>
            </section>
          ) : (
            <>
              <GettingStarted
                title="Your first application"
                steps={clinicSteps({ hasProfile: true, submitted: jobs.filter((j) => j.status !== "draft").length, live: jobs.filter((j) => j.posted_at).length, applications: Object.values(applicants).reduce((sum, a) => sum + a.total, 0) })}
              />
              {waiting > 0 && <p className="replynote">{waiting} {waiting === 1 ? "applicant is" : "applicants are"} waiting for a reply. {RESPONSE_NOTE}</p>}
              <div className="tiles stats">
                {/* Top row: the 3 tiles you can press, each showing the jobs behind it (prefetched so the jump is instant). Bottom row: numbers to read only (Steve, 14th November 2026). */}
                <Link href="/clinic?show=live#your-jobs" prefetch className="card tile tilelink"><p className="kicker">Live</p><p className="num">{count("live")}</p><p>Jobs candidates can see</p></Link>
                <Link href={newApplicantsHref(jobs, applicants)} prefetch className="card tile tilelink"><p className="kicker">New applicants</p><p className="num">{unread}</p><p>Waiting to be opened</p></Link>
                <Link href="/clinic?show=drafts#your-jobs" prefetch className="card tile tilelink"><p className="kicker">Drafts</p><p className="num">{count("draft") + count("rejected")}</p><p>Not sent yet</p></Link>
                <div className="card tile mini"><p className="kicker">In review</p><p className="num">{count("in_review")}</p><p>With our team</p></div>
                <div className="card tile mini"><p className="kicker">Views</p><p className="num">{totals.views30.toLocaleString("en-CA")}</p><p>Last 30 days</p></div>
                <div className="card tile mini"><p className="kicker">Apply clicks</p><p className="num">{totals.clicks30.toLocaleString("en-CA")}</p><p>Last 30 days</p></div>
              </div>
              <p className="small-note statsnote">Views count each visit to a job page once, and leave out search engines, you and our team. An apply click is someone pressing Apply, which is not the same as a finished application, so the applicant counts stay the ones to trust.</p>

              {others.length > 1 && (
                <details className="card allloc">
                  <summary>All locations ({others.length})</summary>
                  <table className="locationsum">
                    <thead><tr><th scope="col">Location</th><th scope="col">Live jobs</th><th scope="col">New applicants</th><th scope="col"><span className="sr">Open</span></th></tr></thead>
                    <tbody>
                      {others.map((c) => (
                        <tr key={c.id}>
                          <td>{c.clinic_name}<br /><span className="help">{c.city}</span></td>
                          <td>{c.live}</td>
                          <td>{c.fresh}</td>
                          <td>{c.id === employer.id ? <span className="help">Open now</span> : <form action={switchLocation}><input type="hidden" name="location" value={c.id} /><input type="hidden" name="back" value="/clinic" /><button type="submit" className="btn sm ghost">Open</button></form>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
              <div className="listhead" id="your-jobs">
                <h2>{show ? SHOW_LABELS[show].title : "Your jobs"}</h2>
                <span className="listactions">
                  {show && <Link href="/clinic#your-jobs" className="btn sm ghost">Show all jobs</Link>}
                  {editor && <Link href="/clinic/jobs/new" className="btn sm"><Icon name="plus" />Post a job</Link>}
                </span>
              </div>

              {jobs.length === 0 ? (
                <section className="card"><p>You have not posted anything yet. When you are ready, choose <strong>Post a job</strong>.</p></section>
              ) : shown.length === 0 && show ? (
                <section className="card"><p>{SHOW_LABELS[show].empty}</p></section>
              ) : (
                <div className="joblist">
                  {shown.map((j) => (
                    <article className="card jobrow stacked" key={j.id}>
                      <div className="jobtop">
                        <div className="jobmain">
                          <h3>{j.title}</h3>
                          <p className="meta">
                            {[employmentLabel(j.employment_type), j.city && j.province ? `${j.city}, ${j.province}` : null, payBasisOf(j) ? payText(j) : null].filter(Boolean).join(" · ") || "Not finished yet"}
                          </p>
                          {j.posted_at && <p className="meta">{numbersLine(numbers[j.id])}</p>}
                          {j.status === "live" && j.expires_at && <p className="meta">Live until {longDate(j.expires_at)} ({daysLeft(j.expires_at)} days left)</p>}
                          {j.status === "in_review" && <p className="meta">With our team. We usually check posts within 1 business day.</p>}
                          <JobPaymentTag jobId={j.id} jobStatus={j.status} payment={payments[j.id]} editor={editor} />
                          {j.status === "rejected" && j.review_note && <p className="note"><strong>What to change:</strong> {j.review_note}</p>}
                        </div>
                        <StatusBadge status={j.status} />
                      </div>
                      <div className="jobfoot">
                        <div className="jobactions">
                          {applicants[j.id] && (
                            <Link href={`/clinic/jobs/${j.id}/applicants`} className="btn sm">
                              Applicants ({applicants[j.id].total}{applicants[j.id].fresh ? `, ${applicants[j.id].fresh} new` : ""})
                            </Link>
                          )}
                          {editor && canExtend(j) && (
                            <QuickActionForm action={extendJobQuiet} ids={[j.id]} className={applicants[j.id] ? "btn sm ghost" : "btn sm"}>Extend 30 days</QuickActionForm>
                          )}
                          {editor && (j.status === "closed" || j.status === "expired") && (
                            <form action={repostJob}><input type="hidden" name="id" value={j.id} /><button type="submit" className="btn sm ghost"><Icon name="refresh" />Post again</button></form>
                          )}
                          {editor && (j.status === "draft" || j.status === "rejected" || j.status === "live") && <Link href={`/clinic/jobs/${j.id}`} className="btn sm ghost"><Icon name="pencil" />Edit</Link>}
                          {j.status === "live" && <Link href={`/jobs/${j.id}`} className="btn sm ghost"><Icon name="eye" />View</Link>}
                        </div>
                        {editor && <div className="jobactions quiet">
                          {(j.status === "live" || j.status === "expired") && (
                            <Link href={`/clinic/jobs/${j.id}/ending`} className="linkbtn"><Icon name="check" />Filled it?</Link>
                          )}
                          {j.status !== "draft" && (
                            <QuickActionForm action={saveJobAsTemplateQuiet} ids={[j.id]} className="linkbtn"><Icon name="copy" />Save as template</QuickActionForm>
                          )}
                          {j.status === "live" && (
                            <QuickActionForm action={closeJobQuiet} ids={[j.id]} className="linkbtn"><Icon name="close" />Close</QuickActionForm>
                          )}
                          {j.status === "in_review" && (
                            <QuickActionForm action={withdrawJobQuiet} ids={[j.id]} className="linkbtn">Take back to edit</QuickActionForm>
                          )}
                          {(j.status === "draft" || j.status === "rejected") && (j.posted_at || applicants[j.id]) && (
                            <QuickActionForm action={closeJobQuiet} ids={[j.id]} className="linkbtn"><Icon name="close" />Close</QuickActionForm>
                          )}
                          {(j.status === "draft" || j.status === "rejected") && !j.posted_at && !applicants[j.id] && (
                            <QuickActionForm action={deleteJobQuiet} ids={[j.id]} className="linkbtn warn"><Icon name="trash" />Delete</QuickActionForm>
                          )}
                        </div>}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <ToastHost />
      <AppFooter />
    </>
  );
}
