import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { approveJob, rejectJob } from "@/lib/admin-actions";
import { employerFlags, formatPay, longDate, reviewFlags } from "@/lib/jobs";
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
  description: string; apply_method: string; apply_url: string | null; created_at: string; employer_id: string;
  employers: { clinic_name: string; practice_type: string; website: string | null; city: string; province: string; direct_hire_confirmed_at: string | null } | null;
};

export default async function ReviewQueue({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("admin");
  const { notice } = await searchParams;
  const db = supabaseAdmin();
  const { data } = db
    ? await db
        .from("jobs")
        .select("id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, created_at, employer_id, employers(clinic_name, practice_type, website, city, province, direct_hire_confirmed_at)")
        .eq("status", "in_review")
        .order("created_at", { ascending: true })
    : { data: null };
  const jobs = (data ?? []) as unknown as QueueJob[];
  const notifyEmails = new Map<string, string>();
  if (db && jobs.length) {
    const { data: contacts } = await db.from("employer_contacts").select("employer_id, notify_email").in("employer_id", [...new Set(jobs.map((j) => j.employer_id))]);
    (contacts ?? []).forEach((c) => notifyEmails.set(c.employer_id, c.notify_email));
  }

  return (
    <>
      <AppBar session={session} current="/admin/review" />
      <main className="app">
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
                  ...reviewFlags(j),
                  ...employerFlags({ website: j.employers?.website, notifyEmail: notifyEmails.get(j.employer_id), directHireConfirmedAt: j.employers?.direct_hire_confirmed_at }),
                ];
                return (
                  <article className="card review" key={j.id}>
                    <div className="listhead">
                      <div>
                        <h2>{j.title}</h2>
                        <p className="meta">
                          {j.employers?.clinic_name} · {j.employers?.practice_type === "corporate" ? "Corporate" : "Independent"} · {j.city}, {j.province} · submitted {longDate(j.created_at)}
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
                    <dl className="facts">
                      <div><dt>Role</dt><dd>{j.role_category}</dd></div>
                      <div><dt>Type</dt><dd>{j.employment_type}</dd></div>
                      <div><dt>Pay</dt><dd>{formatPay(j.pay_min, j.pay_max, j.pay_period)}</dd></div>
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
