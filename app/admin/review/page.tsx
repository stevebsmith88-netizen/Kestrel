import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { approveJob, rejectJob } from "@/lib/admin-actions";
import { changedFields } from "@/lib/job-diff";
import { employerFlags, formatPay, longDate, practiceLabel, reviewFlags } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Review queue | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  approved: "Approved. The job is live.",
  rejected: "Sent back to the clinic with your note.",
  "need-note": "Please tell the clinic what to change before sending a job back.",
  error: "That didn't work. The job may already have been handled. Please refresh and try again.",
};

type QueueJob = {
  id: string; title: string; role_category: string; employment_type: string; province: string; city: string;
  pay_period: string; pay_min: number; pay_max: number; is_existing_vacancy: boolean; uses_ai_screening: boolean;
  description: string; work_arrangement: string | null; territory: string | null; pay_extras: string | null; apply_method: string; apply_url: string | null; created_at: string; employer_id: string; posted_at: string | null; expires_at: string | null;
  employers: { clinic_name: string; practice_type: string; website: string | null; city: string; province: string; direct_hire_confirmed_at: string | null } | null;
};

export default async function ReviewQueue({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("admin");
  const { notice } = await searchParams;
  const db = supabaseAdmin();
  const { data } = db
    ? await db
        .from("jobs")
        .select("id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, work_arrangement, territory, pay_extras, created_at, employer_id, posted_at, expires_at, employers(clinic_name, practice_type, website, city, province, direct_hire_confirmed_at)")
        .eq("status", "in_review")
        .order("created_at", { ascending: true })
    : { data: null };
  const jobs = (data ?? []) as unknown as QueueJob[];
  const notifyEmails = new Map<string, string>();
  if (db && jobs.length) {
    const { data: contacts } = await db.from("employer_contacts").select("employer_id, notify_email").in("employer_id", [...new Set(jobs.map((j) => j.employer_id))]);
    (contacts ?? []).forEach((c) => notifyEmails.set(c.employer_id, c.notify_email));
  }

  // For edited live jobs, the wording candidates were seeing (the most recent copy kept for each job).
  const liveWording = new Map<string, Record<string, unknown>>();
  if (db && jobs.some((j) => j.posted_at)) {
    const { data: versions } = await db.from("job_versions").select("job_id, snapshot").in("job_id", jobs.map((j) => j.id)).order("saved_at", { ascending: false });
    (versions ?? []).forEach((v) => !liveWording.has(v.job_id) && liveWording.set(v.job_id, v.snapshot as Record<string, unknown>));
  }

  return (
    <>
      <AppBar session={session} current="/admin/review" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Admin</p>
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
                          {j.employers?.clinic_name} · {practiceLabel(j.employers?.practice_type)} · {j.city}, {j.province} · submitted {longDate(j.created_at)}
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
                      <div><dt>Type</dt><dd>{j.employment_type}</dd></div>
                      <div><dt>Pay</dt><dd>{formatPay(j.pay_min, j.pay_max, j.pay_period)}</dd></div>
                      {j.territory && <div><dt>Area covered</dt><dd>{j.territory}</dd></div>}
                      {j.pay_extras && <div><dt>Anything else that is part of the pay</dt><dd>{j.pay_extras}</dd></div>}
                      <div><dt>Existing vacancy</dt><dd>{j.is_existing_vacancy ? "Yes" : "No"}</dd></div>
                      <div><dt>Uses AI to screen</dt><dd>{j.uses_ai_screening ? "Yes" : "No"}</dd></div>
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
