import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import StatusBadge from "@/components/StatusBadge";
import { requireRole } from "@/lib/auth";
import { getApplicantCounts, getMyEmployer, getMyJobs } from "@/lib/clinic";
import { closeJob, deleteJob, repostJob, withdrawJob } from "@/lib/clinic-actions";
import { saveJobAsTemplate } from "@/lib/template-actions";
import { daysLeft, formatPay, longDate } from "@/lib/jobs";

export const metadata: Metadata = { title: "Your dashboard | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  "profile-created": "Your clinic profile is saved. You can post your first job now.",
  "job-saved": "Your draft is saved.",
  "job-submitted": "Your job is with our team. We check every post, usually within 1 business day, and it goes live as soon as it is approved.",
  "job-closed": "The job is closed and no longer shown to candidates.",
  "job-withdrawn": "The job is back in your drafts, so you can change it and send it again.",
  "job-deleted": "The job is deleted.",
  "job-edited": "Your changes are with our team. The job is offline until we approve them, usually within 1 business day. Its 30 days keep running.",
  "template-saved": "Saved as a template. Start a new post from it under Post a job.",
  "template-limit": "You have 20 templates already. Delete one under Post a job, then try again.",
  "template-failed": "We couldn't save that template. Please try again.",
  "job-limit": "You have 10 open jobs already. Close or delete one, then try again.",
  "job-repost-failed": "We couldn't copy that job. Please try again.",
};

export default async function ClinicHome({ searchParams }: { searchParams: Promise<{ notice?: string; template?: string }> }) {
  const session = await requireRole("clinic");
  const { notice, template } = await searchParams;
  const employer = await getMyEmployer(session.userId);
  const jobs = employer ? await getMyJobs(employer.id) : [];
  const applicants = employer ? await getApplicantCounts() : {};
  const unread = Object.values(applicants).reduce((sum, c) => sum + c.fresh, 0);
  const first = session.firstName || "there";
  const count = (s: string) => jobs.filter((j) => j.status === s).length;

  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="kicker">{employer ? employer.clinic_name : "Clinic dashboard"}</p>
          <h1>Welcome, {first}</h1>
          {notice && NOTICES[notice] && <p className="notice" role="status">{NOTICES[notice]}{template ? " It is also saved as a template for next time." : ""}</p>}

          {!employer ? (
            <section className="card setup">
              <p className="kicker">First step</p>
              <h2>Set up your clinic profile</h2>
              <p>Tell us about your clinic, and where to send applicant alerts. It takes about 2 minutes, and then you can post your first job.</p>
              <Link href="/clinic/profile" className="btn">Create my clinic profile</Link>
            </section>
          ) : (
            <>
              <div className="tiles stats">
                <section className="card tile"><p className="kicker">Live</p><p className="num">{count("live")}</p><p>Jobs candidates can see</p></section>
                <section className="card tile"><p className="kicker">New applicants</p><p className="num">{unread}</p><p>Waiting to be opened</p></section>
                <section className="card tile"><p className="kicker">In review</p><p className="num">{count("in_review")}</p><p>With our team</p></section>
                <section className="card tile"><p className="kicker">Drafts</p><p className="num">{count("draft") + count("rejected")}</p><p>Not sent yet</p></section>
              </div>

              <div className="listhead">
                <h2>Your jobs</h2>
                <Link href="/clinic/jobs/new" className="btn sm">Post a job</Link>
              </div>

              {jobs.length === 0 ? (
                <section className="card"><p>You have not posted anything yet. When you are ready, choose <strong>Post a job</strong>.</p></section>
              ) : (
                <div className="joblist">
                  {jobs.map((j) => (
                    <article className="card jobrow" key={j.id}>
                      <div className="jobmain">
                        <h3>{j.title}</h3>
                        <p className="meta">
                          {[j.employment_type, j.city && j.province ? `${j.city}, ${j.province}` : null, j.pay_min && j.pay_max && j.pay_period ? formatPay(j.pay_min, j.pay_max, j.pay_period) : null].filter(Boolean).join(" · ") || "Not finished yet"}
                        </p>
                        {j.status === "live" && j.expires_at && <p className="meta">Live until {longDate(j.expires_at)} ({daysLeft(j.expires_at)} days left)</p>}
                        {j.status === "in_review" && <p className="meta">With our team. We usually check posts within 1 business day.</p>}
                        {j.status === "rejected" && j.review_note && <p className="note"><strong>What to change:</strong> {j.review_note}</p>}
                      </div>
                      <div className="jobside">
                        <StatusBadge status={j.status} />
                        <div className="jobactions">
                          {(j.status === "draft" || j.status === "rejected" || j.status === "live") && <Link href={`/clinic/jobs/${j.id}`} className="btn sm ghost">Edit</Link>}
                          {(j.status === "closed" || j.status === "expired") && (
                            <form action={repostJob}><input type="hidden" name="id" value={j.id} /><button type="submit" className="btn sm ghost">Post again</button></form>
                          )}
                          {applicants[j.id] && (
                            <Link href={`/clinic/jobs/${j.id}/applicants`} className="btn sm">
                              Applicants ({applicants[j.id].total}{applicants[j.id].fresh ? `, ${applicants[j.id].fresh} new` : ""})
                            </Link>
                          )}
                          {j.status !== "draft" && (
                            <form action={saveJobAsTemplate}><input type="hidden" name="id" value={j.id} /><button type="submit" className="linkbtn">Save as template</button></form>
                          )}
                          {j.status === "live" && <Link href={`/jobs/${j.id}`} className="btn sm ghost">View</Link>}
                          {j.status === "live" && (
                            <form action={closeJob}><input type="hidden" name="id" value={j.id} /><button type="submit" className="linkbtn">Close</button></form>
                          )}
                          {j.status === "in_review" && (
                            <form action={withdrawJob}><input type="hidden" name="id" value={j.id} /><button type="submit" className="linkbtn">Take back to edit</button></form>
                          )}
                          {(j.status === "draft" || j.status === "rejected") && (
                            <form action={deleteJob}><input type="hidden" name="id" value={j.id} /><button type="submit" className="linkbtn">Delete</button></form>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
