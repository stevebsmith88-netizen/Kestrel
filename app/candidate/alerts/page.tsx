import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import AlertForm from "@/components/AlertForm";
import { requireRole } from "@/lib/auth";
import { practiceLabel } from "@/lib/jobs";
import { deleteAlert } from "@/lib/alert-actions";
import { supabaseServer } from "@/lib/supabase/server";
import { ALERTS_PAUSED_NOTE, alertsPaused } from "@/lib/alerts-paused";
import Link from "next/link";

export const metadata: Metadata = { title: "Job alerts | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Alert = { id: string; role_category: string | null; province: string | null; practice_type: string | null; frequency: string };

const describe = (a: Alert) =>
  [a.role_category ?? "Any role", a.province ?? "all of Canada", a.practice_type ? `${practiceLabel(a.practice_type).toLowerCase()} employers` : "any type of employer", a.frequency].join(" · ");

export default async function Alerts() {
  const session = await requireRole("candidate");
  const db = await supabaseServer();
  const { data } = db ? await db.from("job_alerts").select("id, role_category, province, practice_type, frequency").order("created_at", { ascending: true }) : { data: null };
  const alerts = (data ?? []) as Alert[];
  // Read on its own, so the page still works if it fails. Unsubscribing also stops alert emails (P1-51).
  const { data: profile } = db ? await db.from("profiles").select("unsubscribed_at").eq("id", session.userId).maybeSingle() : { data: null };
  const paused = alertsPaused(profile);
  return (
    <>
      <AppBar session={session} current="/candidate/alerts" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Job alerts</p>
          <h1>Hear about new jobs first</h1>
          <p className="lede2">Tell us what you are looking for and we will email you when a matching job is posted. You choose how often, daily, weekly or monthly, and every email has an unsubscribe link. These are emails you set up yourself, so they do not depend on the news box you may have ticked at sign up.</p>
          {paused && (
            <div className="notice warn noticerow" role="status">
              <p>{ALERTS_PAUSED_NOTE}</p>
              <Link href="/account#ac-email-prefs" className="btn sm ghost">Go to Email choices</Link>
            </div>
          )}
          <div className="stackcards">
            <section className="card">
              <h2>Your alerts</h2>
              {alerts.length === 0 ? (
                <p className="help">You have no alerts yet. Add one below.</p>
              ) : (
                <ul className="alertlist">
                  {alerts.map((a) => (
                    <li key={a.id}>
                      <span>{describe(a)}</span>
                      <form action={deleteAlert}><input type="hidden" name="id" value={a.id} /><button type="submit" className="linkbtn">Remove</button></form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {alerts.length < 5 && <AlertForm />}
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
