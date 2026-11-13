import { withExpected } from "@/lib/expected-columns";
import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { approveJob, rejectJob } from "@/lib/admin-actions";
import { changedFields } from "@/lib/job-diff";
import { answerLabel, employeeBandLabel, employerFlags, employmentLabel, longDate, practiceLabel, reviewFlags } from "@/lib/jobs";
import { payText } from "@/lib/job-pay";
import { TAG_GROUPS, tagsFromRow } from "@/lib/job-tags";
import { supabaseAdmin } from "@/lib/supabase-server";
import { REVIEW_COLUMNS, loadReviewQueue } from "@/lib/review-queue";

export const metadata: Metadata = { title: "Review queue | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  approved: "Approved. The job is live.",
  quebec: "Not approved. This job is in Quebec, and Kestrel can't post jobs in Quebec yet. Send it back to the clinic with a note.",
  rejected: "Sent back to the clinic with your note.",
  "need-note": "Please tell the clinic what to change before sending a job back.",
  error: "That didn't work. The job may already have been handled. Please refresh and try again.",
};

export default async function ReviewQueue({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("admin");
  const { notice } = await searchParams;
  const db = supabaseAdmin();
  const { jobs, notifyEmails, bands, liveWording } = await loadReviewQueue(db, await withExpected(REVIEW_COLUMNS));

  return (
    <>
      <AppBar session={session} current="/admin/review" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Review queue</h1>
          <p className="lede2">Check each post before it goes live. Approving it starts its 30 days.</p>
          {notice && NOTICES[notice] && <p className="notice" role="status">{NOTICES[notice]}</p>}

          {jobs.length === 0 ? (
            <section className="card"><p>Nothing is waiting. New posts appear here as soon as a clinic submits them.</p></section>
          ) : (
            <div className="joblist">
              {jobs.map((j) => {
                const flags = [
                  ...(j.posted_at ? [`Changes to a job that was already live since ${longDate(j.posted_at)}.${liveWording.has(j.id) ? " What changed is listed below." : " No copy of the earlier wording was kept for this one."}`] : []),
                  ...reviewFlags(j),
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
                      <div><dt>Applications</dt><dd>{j.apply_method === "external" ? `On their own page: ${j.apply_url}` : "Through Kestrel"}</dd></div>
                    </dl>
                    <pre className="adtext">{j.description}</pre>
                    <div className="reviewbtns">
                      <form action={approveJob}>
                        <input type="hidden" name="id" value={j.id} />
                        <button type="submit" className="btn">Approve and publish</button>
                      </form>
                      <form action={rejectJob} className="rejectform">
                        <input type="hidden" name="id" value={j.id} />
                        <label className="lab" htmlFor={`note-${j.id}`}>Or send it back, and tell the clinic what to change</label>
                        <textarea id={`note-${j.id}`} name="note" rows={3} />
                        <button type="submit" className="btn ghost">Send back</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
