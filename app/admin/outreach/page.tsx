import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { outreachDailyLimit, outreachOn } from "@/lib/features";
import { longDate } from "@/lib/jobs";
import { addToOutreach, stopOutreach } from "@/lib/outreach-actions";
import { LAST_STEP } from "@/lib/outreach-sequence";
import { supabaseAdmin } from "@/lib/supabase-server";
import { loadOutreach } from "@/lib/admin-loaders";

export const metadata: Metadata = { title: "Outreach | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const STOPS: Record<string, string> = {
  unsubscribed: "Unsubscribed",
  replied: "Replied",
  joined: "Joined Kestrel",
  claimed: "Claimed a listing",
  bounced: "Bounced",
  manual: "Stopped by you",
};

type Contact = { id: string; email: string; clinic_name: string; steps_sent: number; status: string; stop_reason: string | null; next_due_at: string | null; last_sent_at: string | null };

export default async function Outreach({ searchParams }: { searchParams: Promise<{ notice?: string; count?: string }> }) {
  const session = await requireRole("admin");
  const { notice, count } = await searchParams;
  const db = supabaseAdmin();
  const loaded = await loadOutreach(db);
  const { leadError, contactError } = loaded;
  const contacts = loaded.contacts as unknown as Contact[];
  const ready = loaded.ready as unknown as { id: string; clinic_name: string; city: string | null; province: string; contact_email: string; email_source_url: string | null }[];
  const active = contacts.filter((c) => c.status === "active");
  const done = contacts.filter((c) => c.status !== "active");
  const on = outreachOn();

  const notices: Record<string, string> = {
    added: `${count ?? 0} ${count === "1" ? "clinic is" : "clinics are"} now in the sequence.${on ? " The first email goes with the next daily run." : " Nothing is sent while outreach is switched off."}`,
    "none-ticked": "Tick at least 1 clinic first.",
    stopped: "Stopped. They won't get any more of the sequence.",
  };

  return (
    <>
      <AppBar session={session} current="/admin/outreach" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <h1>Clinic outreach</h1>
          <p className="lede2">
            {LAST_STEP} emails over about 5 weeks (day 1, 8, 18 and 32), each from a different angle, to an address the clinic published for business enquiries. The sequence stops by itself when a clinic unsubscribes, joins the waitlist, opens an account or claims a listing. If they reply, stop it here.
          </p>
          <p className={on ? "notice" : "note"} role="status">
            {on
              ? `Sending is on. The daily run sends up to ${outreachDailyLimit()} outreach emails a day.`
              : "Sending is off. You can add clinics, but nothing is sent until ENABLE_OUTREACH is set to yes in Vercel, after your disclosure conversation and a lawyer's check."}
          </p>
          {(leadError || contactError) && <p className="note">Something couldn&apos;t be read. Has migration 0029 been run on this database?</p>}
          {notice && notices[notice] && <p className="notice" role="status">{notices[notice]}</p>}

          <section className="card">
            <h2>Ready to add ({ready.length})</h2>
            <p className="help">Clinics from <Link href="/admin/found">the province search</Link> with a published address and the page it came from. Ticking them and starting is your approval of this batch.</p>
            {ready.length === 0 ? (
              <p className="help">No one is waiting. Save clinics with a contact email in the province search first.</p>
            ) : (
              <form action={addToOutreach} className="stackform">
                <ul className="alertlist">
                  {ready.map((l) => (
                    <li key={l.id}>
                      <label className="consent">
                        <input type="checkbox" name="leadIds" value={l.id} />
                        <span><strong>{l.clinic_name}</strong>{l.city ? `, ${l.city}` : ""} {l.province}<br /><span className="help">{l.contact_email}, found on <a href={l.email_source_url ?? "#"} rel="noopener noreferrer" target="_blank">their page</a></span></span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div><button type="submit" className="btn">Start the sequence for the ticked clinics</button></div>
              </form>
            )}
          </section>

          <section className="card">
            <h2>In the sequence ({active.length})</h2>
            {active.length === 0 ? (
              <p className="help">No one yet.</p>
            ) : (
              <ul className="alertlist">
                {active.map((c) => (
                  <li key={c.id}>
                    <span><strong>{c.clinic_name}</strong><br /><span className="help">{c.email} · {c.steps_sent} of {LAST_STEP} sent · next {c.next_due_at ? longDate(c.next_due_at) : "not set"}</span></span>
                    <span className="jobactions">
                      <form action={stopOutreach}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="reason" value="replied" /><button type="submit" className="linkbtn">They replied</button></form>
                      <form action={stopOutreach}><input type="hidden" name="id" value={c.id} /><button type="submit" className="linkbtn">Stop</button></form>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {done.length > 0 && (
            <section className="card">
              <h2>Finished or stopped ({done.length})</h2>
              <ul className="alertlist">
                {done.map((c) => (
                  <li key={c.id}>
                    <span><strong>{c.clinic_name}</strong><br /><span className="help">{c.email} · {c.steps_sent} of {LAST_STEP} sent · {c.status === "finished" ? "All sent" : STOPS[c.stop_reason ?? ""] ?? "Stopped"}{c.last_sent_at ? ` · last ${longDate(c.last_sent_at)}` : ""}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
