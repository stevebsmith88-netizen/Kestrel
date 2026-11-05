import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { clinicsAtSite } from "@/lib/found-db";
import { longDate } from "@/lib/jobs";
import { outreachEmail } from "@/lib/outreach";
import { outreachProblems } from "@/lib/outreach-check";
import { addressUnsubscribeUrl, isSuppressed } from "@/lib/suppression";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Outreach dry run | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Lead = {
  id: string; clinic_name: string; website: string; city: string | null; province: string; careers_url: string | null; job_title: string | null; source_url: string | null;
  contact_email: string | null; email_source_url: string | null; email_found_at: string | null; found_at: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A dry run of clinic outreach. It checks each saved lead against the conditions in docs/casl-outreach.md and shows the exact email
// that would go out. Nothing is sent from this page, and nothing in Kestrel can send clinic outreach yet.
export default async function OutreachCheck({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const session = await requireRole("admin");
  const { lead: previewId } = await searchParams;
  const db = supabaseAdmin();
  const { data } = db ? await db.from("clinic_leads").select("id, clinic_name, website, city, province, careers_url, job_title, source_url, contact_email, email_source_url, email_found_at, found_at").neq("status", "skipped").order("found_at", { ascending: false }).limit(100) : { data: null };
  const leads = (data ?? []) as Lead[];
  const rows = await Promise.all(
    leads.map(async (l) => {
      const clinics = db ? await clinicsAtSite(db, l.website) : [];
      const suppressed = l.contact_email ? await isSuppressed(l.contact_email) : false;
      const problems = outreachProblems({
        contactEmail: l.contact_email, emailSourceUrl: l.email_source_url, emailFoundAt: l.email_found_at, website: l.website,
        suppressed, onKestrel: clinics.some((c) => c.claimed || c.owner_id), hasListing: clinics.length > 0,
      });
      return { lead: l, problems };
    }),
  );
  const ready = rows.filter((r) => r.problems.length === 0).length;
  const chosen = previewId && UUID.test(previewId) ? rows.find((r) => r.lead.id === previewId)?.lead : undefined;
  const preview = chosen?.contact_email
    ? outreachEmail({
        clinicName: chosen.clinic_name,
        jobTitle: chosen.job_title || "eye care",
        sourceUrl: chosen.careers_url || chosen.source_url || chosen.website,
        listingUrl: "https://eyecarejobs.ca/jobs",
        claimUrl: "https://eyecarejobs.ca/claim",
        unsubscribeUrl: addressUnsubscribeUrl(chosen.contact_email),
      })
    : null;
  return (
    <>
      <AppBar session={session} current="/admin/outreach-check" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Admin</p>
          <h1>Outreach dry run</h1>
          <p className="lede2">Checks each saved lead against the rules for emailing a clinic, and shows the exact email. <strong>Nothing is sent from this page, and nothing in Kestrel can send clinic outreach yet.</strong> It stays off until your disclosure conversation has happened and the lawyer has seen the wording.</p>
          <section className="card">
            <p><strong>{ready}</strong> of {rows.length} saved {rows.length === 1 ? "lead meets" : "leads meet"} every condition we can check by machine. A person still reads each email before anything is ever sent.</p>
            <p className="help">The conditions: a published business address with the page and date it was found on, on the clinic&apos;s own website and found in the last 90 days, not on the do not email list, the clinic is not already on Kestrel, and there is a listing for the email to be about. See <code>docs/casl-outreach.md</code>.</p>
          </section>
          {rows.length === 0 ? (
            <p className="help">No saved leads yet. Search a province on <Link href="/admin/found">Found listings</Link> and save the clinics worth following up.</p>
          ) : (
            <ul className="alertlist">
              {rows.map(({ lead: l, problems }) => (
                <li key={l.id}>
                  <span>
                    <strong>{l.clinic_name}</strong>, {[l.city, l.province].filter(Boolean).join(", ")}{l.job_title ? ` · ${l.job_title}` : ""}<br />
                    <span className="help">{l.contact_email ? `${l.contact_email}, found ${l.email_found_at ? longDate(l.email_found_at) : "(date not recorded)"}` : "No email yet"}</span>
                    {problems.length === 0 ? <><br /><span className="ok-msg">Meets every condition we can check.</span></> : (
                      <ul className="plainlist">{problems.map((p) => <li key={p} className="help">{p}</li>)}</ul>
                    )}
                  </span>
                  {l.contact_email && <span className="jobactions"><Link href={`/admin/outreach-check?lead=${l.id}`} className="btn sm ghost">Preview the email</Link></span>}
                </li>
              ))}
            </ul>
          )}
          {preview && chosen && (
            <section className="card" aria-labelledby="pv-h">
              <h2 id="pv-h">Preview for {chosen.clinic_name}</h2>
              <p className="help">To: {chosen.contact_email}. Subject: <strong>{preview.subject}</strong>. The listing and claim buttons are placeholders until a listing is published. The unsubscribe link is a real signed link for this address.</p>
              <iframe title="Preview of the email" srcDoc={preview.html} sandbox="" style={{ width: "100%", height: 720, border: "1px solid var(--line)", borderRadius: 6, background: "#fff" }} />
            </section>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
