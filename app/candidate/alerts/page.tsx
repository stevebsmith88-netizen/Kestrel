import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import AlertForm from "@/components/AlertForm";
import { requireRole } from "@/lib/auth";
import { deleteAlert } from "@/lib/alert-actions";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Job alerts | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Alert = { id: string; role_category: string | null; province: string | null; practice_type: string | null; frequency: string };

const describe = (a: Alert) =>
  [a.role_category ?? "Any role", a.province ?? "all of Canada", a.practice_type ? (a.practice_type === "corporate" ? "corporate practices" : "independent practices") : "any practice", a.frequency].join(" · ");

export default async function Alerts() {
  const session = await requireRole("candidate");
  const db = await supabaseServer();
  const { data } = db ? await db.from("job_alerts").select("id, role_category, province, practice_type, frequency").order("created_at", { ascending: true }) : { data: null };
  const alerts = (data ?? []) as Alert[];
  return (
    <>
      <AppBar session={session} current="/candidate/alerts" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Job alerts</p>
          <h1>Hear about new jobs first</h1>
          <p className="lede2">Tell us what you are looking for and we will email you when a matching job is posted. You choose how often, daily, weekly or monthly, and every email has an unsubscribe link.</p>
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
