import { withExpected } from "@/lib/expected-columns";
import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { type AdminJob, type AdminPayment } from "@/components/admin-job-types";
import AdminJobRow from "@/components/AdminJobRow";
import JobActivity from "@/components/JobActivity";
import ReviewButtons from "@/components/ReviewButtons";
import { loadActivity } from "@/lib/job-activity";
import { REVIEW_NOTICES, reviewMessage } from "@/lib/review-notices";
import { changedFields } from "@/lib/job-diff";
import { answerLabel, employeeBandLabel, employerFlags, employmentLabel, longDate, practiceLabel, reviewFlags } from "@/lib/jobs";
import { payText } from "@/lib/job-pay";
import { TAG_GROUPS, tagsFromRow } from "@/lib/job-tags";
import { supabaseAdmin } from "@/lib/supabase-server";
import { REVIEW_COLUMNS, loadReviewQueue } from "@/lib/review-queue";
import { bandMismatchFlag, paymentLine } from "@/lib/checkout-mode";

export const metadata: Metadata = { title: "Review queue | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// How many recently handled jobs the strip shows. Everything else is on the Jobs page, which can search and page.
const RECENT_LIMIT = 10;

export default async function ReviewQueue({ searchParams }: { searchParams: Promise<{ notice?: string; why?: string }> }) {
  const session = await requireRole("admin");
  const { notice, why } = await searchParams;
  const db = supabaseAdmin();
  const { jobs, notifyEmails, bands, liveWording } = await loadReviewQueue(db, await withExpected(REVIEW_COLUMNS));
  // Jobs handled in the last 7 days (approved and live, or sent back), so a job does not vanish the moment it is dealt with and its notes can still be read.
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentRows } = db
    ? await db.from("jobs").select("id, title, status, role_category, city, province, posted_at, expires_at, updated_at, employers(clinic_name)").in("status", ["live", "rejected"]).gte("updated_at", weekAgo).order("updated_at", { ascending: false }).limit(RECENT_LIMIT)
    : { data: null };
  const recent = (recentRows ?? []) as unknown as AdminJob[];
  const allIds = [...jobs.map((j) => j.id), ...recent.map((j) => j.id)];
  const activity = db ? await loadActivity(db, allIds) : new Map();
  // The payment for each job (migration 0048). A database without it just shows no payment line.
  const payments = new Map<string, AdminPayment>();
  if (db && allIds.length) {
    const { data: rows } = await db.from("job_payments").select("job_id, status, amount_cents, band, failure_message, created_at").in("job_id", allIds).order("created_at", { ascending: false });
    (rows ?? []).forEach((r) => !payments.has(r.job_id) && payments.set(r.job_id, r));
  }

  return (
    <>
      <AppBar session={session} current="/admin/review" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Review queue</h1>
          <p className="lede2">Check each post before it goes live. Approving it puts it live and starts its run: 60 days during the free launch, 30 days after.</p>
          {notice && REVIEW_NOTICES[notice] && <p className="notice" role="status">{reviewMessage(notice, why)}</p>}

          {jobs.length > 0 && <p className="waitcount" role="status">{jobs.length} waiting for a decision</p>}
          {jobs.length === 0 ? (
            <section className="card"><p>Nothing is waiting. New posts appear here as soon as a clinic submits them.</p></section>
          ) : (
            <div className="joblist">
              {jobs.map((j) => {
                const flags = [
                  ...(j.posted_at ? [`Changes to a job that was already live since ${longDate(j.posted_at)}.${liveWording.has(j.id) ? " What changed is listed below." : " No copy of the earlier wording was kept for this one."}`] : []),
                  ...reviewFlags(j),
                  ...(bandMismatchFlag(j.title, j.role_category) ? [bandMismatchFlag(j.title, j.role_category) as string] : []),
                  ...employerFlags({ website: j.employers?.website, notifyEmail: notifyEmails.get(j.employer_id), directHireConfirmedAt: j.employers?.direct_hire_confirmed_at }),
                ];
                return (
                  <article className="card review" key={j.id}>
                    <div className="listhead">
                      <div>
                        <h2>{j.title}</h2>
                        <p className="meta">
                          {j.employers?.clinic_name} · {practiceLabel(j.employers?.practice_type)} · {employeeBandLabel(bands.get(j.employer_id))} people · {j.city}, {j.province} · submitted {longDate(j.created_at)}
                        </p>
                      </div>
                    </div>
                    {flags.length > 0 ? (
                      <div className="flags" role="alert">
                        <strong>Look at these first</strong>
                        <ul>{flags.map((f) => <li key={f}>{f}</li>)}</ul>
                      </div>
                    ) : (
                      <p className="allclear">No automatic flags.</p>
                    )}
                    {liveWording.has(j.id) && (
                      <div className="flags">
                        <strong>What changed since candidates last saw it</strong>
                        {changedFields(liveWording.get(j.id) ?? {}, j as unknown as Record<string, unknown>).length === 0 ? (
                          <p>Nothing visible changed.</p>
                        ) : (
                          <ul>
                            {changedFields(liveWording.get(j.id) ?? {}, j as unknown as Record<string, unknown>).map((c) => (
                              <li key={c.label}><strong>{c.label}:</strong> {c.before.length > 200 ? `${c.before.slice(0, 200)}…` : c.before} → {c.after.length > 200 ? `${c.after.slice(0, 200)}…` : c.after}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <dl className="facts">
                      <div><dt>Role</dt><dd>{j.role_category}</dd></div>
                      <div><dt>Type</dt><dd>{employmentLabel(j.employment_type)}</dd></div>
                      <div><dt>Pay</dt><dd>{payText(j)}</dd></div>
                      {j.territory && <div><dt>Area covered</dt><dd>{j.territory}</dd></div>}
                      {j.pay_extras && <div><dt>Anything else that is part of the pay</dt><dd>{j.pay_extras}</dd></div>}
                      {TAG_GROUPS.map((g) => (tagsFromRow(j)[g.key].length > 0 ? <div key={g.key}><dt>{g.label}</dt><dd>{tagsFromRow(j)[g.key].join(", ")}</dd></div> : null))}
                      <div><dt>Existing vacancy</dt><dd>{answerLabel(j.is_existing_vacancy)}</dd></div>
                      <div><dt>Uses AI to screen</dt><dd>{answerLabel(j.uses_ai_screening)}</dd></div>
                      <div><dt>Payment</dt><dd>{paymentLine(payments.get(j.id), j.role_category)}</dd></div>
                      <div><dt>Applications</dt><dd>{j.apply_method === "external" ? `On their own page: ${j.apply_url}` : "Through Kestrel"}</dd></div>
                    </dl>
                    <ReviewButtons id={j.id} />
                    <details className="adfold">
                      <summary>Read the ad</summary>
                      <pre className="adtext">{j.description}</pre>
                    </details>
                    <JobActivity rows={activity.get(j.id) ?? []} />
                  </article>
                );
              })}
            </div>
          )}

          <h2 className="subhead">Recently handled</h2>
          <p className="help">The latest {RECENT_LIMIT} jobs approved or sent back in the last 7 days, newest first. Press one for its payment and notes.</p>
          {recent.length === 0 ? (
            <section className="card"><p>Nothing handled in the last 7 days.</p></section>
          ) : (
            <div className="joblist">
              {recent.map((j) => <AdminJobRow key={j.id} job={j} payment={payments.get(j.id)} activity={activity.get(j.id) ?? []} />)}
            </div>
          )}
          <p><Link href="/admin/jobs" className="btn sm ghost">See all jobs</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
