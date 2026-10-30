import type { Metadata } from "next";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { addSuppression, removeSuppression } from "@/lib/admin-actions";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Do not email | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  added: "Added. We will not send marketing or outreach email to it.",
  removed: "Removed from the list.",
  "bad-address": "Enter an email address like hiring@clinic.ca, or a whole domain like @clinic.ca.",
  error: "That didn't work. Please try again.",
};

const REASONS: Record<string, string> = {
  unsubscribed: "Unsubscribed",
  asked_to_stop: "Asked us to stop",
  bounced: "Bounced",
  complaint: "Complaint",
  admin: "Added by admin",
};

export default async function Suppressions({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("admin");
  const { notice } = await searchParams;
  const db = supabaseAdmin();
  const { data } = db ? await db.from("email_suppressions").select("id, address, reason, source, created_at").order("created_at", { ascending: false }).limit(500) : { data: null };
  const rows = data ?? [];
  return (
    <>
      <AppBar session={session} current="/admin/suppressions" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Admin</p>
          <h1>Do not email list</h1>
          <p className="lede2">Addresses here never receive marketing or outreach email from Kestrel, including about jobs posted later. People are added automatically when they unsubscribe. Emails about an account or an application, such as a new applicant, are not marketing and still go out.</p>
          {notice && NOTICES[notice] && <p className="notice" role="status">{NOTICES[notice]}</p>}

          <section className="card">
            <h2>Add an address</h2>
            <p className="help">Use this when someone asks you to stop by email or phone. Type a whole domain, such as @clinic.ca, to stop everyone at a clinic.</p>
            <form action={addSuppression} className="inlineform">
              <label className="lab" htmlFor="sup-address">Email address or domain</label>
              <input id="sup-address" name="address" type="text" required placeholder="hiring@clinic.ca or @clinic.ca" />
              <button type="submit" className="btn">Add to the list</button>
            </form>
          </section>

          <section className="card">
            <h2>{rows.length} on the list</h2>
            {rows.length === 0 ? (
              <p className="help">No one yet.</p>
            ) : (
              <ul className="alertlist">
                {rows.map((r) => (
                  <li key={r.id}>
                    <span><strong>{r.address}</strong><br /><span className="help">{REASONS[r.reason] ?? r.reason} · {longDate(r.created_at)}</span></span>
                    <form action={removeSuppression}><input type="hidden" name="id" value={r.id} /><button type="submit" className="linkbtn">Remove</button></form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
