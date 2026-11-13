import type { Metadata } from "next";
import Link from "next/link";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import FoundListingReader from "@/components/FoundListingReader";
import SetupCheck from "@/components/SetupCheck";
import { requireRole } from "@/lib/auth";
import { seedingOn } from "@/lib/features";
import { deleteFoundDraft, publishFoundListing, takeDownFoundListing } from "@/lib/found-listing-actions";
import { setLeadStatus } from "@/lib/lead-actions";
import { setupChecks } from "@/lib/setup-check";
import { READS_PER_DAY, readingFresh } from "@/lib/found-listings";
import { answerLabel, daysLeft, employmentLabel, formatPay, longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Found listings | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";
// Reading a page, or searching a province, can take a minute or 2.
export const maxDuration = 120;

const NOTICES: Record<string, string> = {
  published: "Published. It is live for 21 days, or until the clinic claims it.",
  deleted: "Draft deleted.",
  "taken-down": "Taken down. It no longer shows on Kestrel.",
  off: "Publishing found listings is switched off.",
  stale: "That draft was read more than a week ago. Read the page again before publishing, in case the job has changed or been filled.",
  error: "That didn't work. It may already have been handled. Please refresh and try again.",
};

type FoundRow = {
  id: string; title: string; status: string; city: string; province: string; employment_type: string;
  pay_min: number; pay_max: number; pay_period: string; source_url: string | null; apply_url: string | null;
  found_at: string | null; posted_at: string | null; expires_at: string | null; updated_at: string;
  is_existing_vacancy: boolean | null; uses_ai_screening: boolean | null; description: string;
  employers: { clinic_name: string; claimed: boolean; website: string | null } | null;
};

export default async function FoundListings({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const session = await requireRole("admin");
  const { notice } = await searchParams;
  const db = supabaseAdmin();
  const publishOn = seedingOn();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: leadRows } = db ? await db.from("clinic_leads").select("id, clinic_name, province, city, job_title, website, contact_email, email_source_url, status, found_at").order("found_at", { ascending: false }).limit(100) : { data: null };
  const leads = (leadRows ?? []) as { id: string; clinic_name: string; province: string; city: string | null; job_title: string | null; website: string; contact_email: string | null; email_source_url: string | null; status: string; found_at: string }[];
  const [{ data }, reads] = db
    ? await Promise.all([
        db.from("jobs")
          .select("id, title, status, city, province, employment_type, pay_min, pay_max, pay_period, source_url, apply_url, found_at, posted_at, expires_at, updated_at, is_existing_vacancy, uses_ai_screening, description, employers(clinic_name, claimed, website)")
          .eq("is_seeded", true)
          .order("created_at", { ascending: false })
          .limit(200),
        db.from("page_reads").select("id", { count: "exact", head: true }).eq("read_by", session.userId).not("url", "like", "search:%").gte("read_at", since),
      ])
    : [{ data: null }, { count: null, error: null }];
  const jobs = (data ?? []) as unknown as FoundRow[];
  const now = Date.now();
  const isLive = (j: FoundRow) => j.status === "live" && j.expires_at !== null && new Date(j.expires_at).getTime() > now;
  const drafts = jobs.filter((j) => j.status === "draft");
  const live = jobs.filter(isLive);
  const ended = jobs.filter((j) => j.status !== "draft" && !isLive(j)).slice(0, 20);
  const needsMigration = Boolean(reads.error);

  return (
    <>
      <AppBar session={session} current="/admin" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="back"><Link href="/admin">Back to the overview</Link></p>
          <h1>Found listings</h1>
          <p className="lede2">Jobs from a clinic&apos;s own careers page, for clinics that are not on Kestrel yet. Paste the page, check what the reader found against the page, then save it. A found listing comes down by itself after 21 days unless the clinic claims it.</p>
          {notice && NOTICES[notice] && <p className="notice" role="status">{NOTICES[notice]}</p>}

          {!publishOn && (
            <section className="card">
              <h2>Publishing is switched off</h2>
              <p>You can read pages and save drafts. Nothing is public and no clinic is contacted. Publishing stays off until your disclosure conversation has happened. Then set <code>ENABLE_SEEDING</code> to <code>yes</code> in Vercel and redeploy.</p>
            </section>
          )}
          {needsMigration && <p className="notice" role="status">The database needs migration 0023 before the reader can run. See docs/found-listings.md.</p>}

          <SetupCheck checks={setupChecks(process.env)} />
          <FoundListingReader publishOn={publishOn} />
          {!needsMigration && <p className="help">Pages read in the last 24 hours: {reads.count ?? 0} of {READS_PER_DAY}.</p>}

          <h2>Saved leads ({leads.length})</h2>
          {leads.length === 0 ? <section className="card"><p>No leads saved yet. Search a province above and save the clinics worth following up. A lead is a note, not a listing: nothing is published from it and nobody is contacted.</p></section> : (
            <section className="card">
              <p className="help">Contact emails are kept with the page they were published on. Nobody is emailed from here, and outreach stays off until your disclosure conversation has happened. <a href="/admin/found/leads.csv">Download as a spreadsheet</a></p>
              <ul className="plainlist">
                {leads.map((l) => (
                  <li key={l.id}>
                    <strong>{l.clinic_name}</strong>, {[l.city, l.province].filter(Boolean).join(", ")}{l.job_title ? ` · ${l.job_title}` : ""} · <a href={l.website} target="_blank" rel="noopener noreferrer">website<span className="sr"> (opens in a new tab)</span></a>
                    {l.contact_email ? <> · {l.contact_email}{l.email_source_url && <> (<a href={l.email_source_url} target="_blank" rel="noopener noreferrer">where it was published<span className="sr"> (opens in a new tab)</span></a>)</>}</> : " · no email yet"}
                    {" "}· {l.status} · found {longDate(l.found_at)}{" "}
                    <form action={setLeadStatus} className="inlineform">
                      <input type="hidden" name="id" value={l.id} />
                      <button type="submit" name="status" value="listed" className="linkbtn">Mark listed</button>{" "}
                      <button type="submit" name="status" value="skipped" className="linkbtn">Skip</button>{" "}
                      <button type="submit" name="status" value="remove" className="linkbtn">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <h2>Drafts ({drafts.length})</h2>
          {drafts.length === 0 ? <section className="card"><p>No drafts.</p></section> : (
            <div className="joblist">
              {drafts.map((j) => {
                const fresh = j.found_at ? readingFresh(j.found_at) : false;
                return (
                  <article className="card review" key={j.id}>
                    <FoundSummary j={j} />
                    {!fresh && <p className="flags">Read more than a week ago. Read the page again before publishing, then delete this draft.</p>}
                    <div className="reviewbtns">
                      {publishOn && fresh && !j.employers?.claimed && (
                        <form action={publishFoundListing}><input type="hidden" name="id" value={j.id} /><button type="submit" className="btn">Publish for 21 days</button></form>
                      )}
                      <form action={deleteFoundDraft}><input type="hidden" name="id" value={j.id} /><button type="submit" className="btn ghost">Delete draft</button></form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <h2>Live ({live.length})</h2>
          {live.length === 0 ? <section className="card"><p>No found listings are live.</p></section> : (
            <div className="joblist">
              {live.map((j) => (
                <article className="card review" key={j.id}>
                  <FoundSummary j={j} />
                  <p className="meta">
                    {j.employers?.claimed ? "Claimed by the clinic, which now manages it" : `Not yet claimed · ${daysLeft(j.expires_at ?? new Date())} days left, comes down on ${longDate(j.expires_at ?? new Date())}`}
                  </p>
                  <div className="reviewbtns">
                    <Link href={`/jobs/${j.id}`} className="btn ghost">Open the listing</Link>
                    {!j.employers?.claimed && (
                      <form action={takeDownFoundListing}><input type="hidden" name="id" value={j.id} /><button type="submit" className="btn ghost">Take it down</button></form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {ended.length > 0 && (
            <>
              <h2>Recently ended</h2>
              <ul className="plainlist">
                {ended.map((j) => (
                  <li key={j.id}>{j.title}, {j.employers?.clinic_name} · {j.status === "closed" ? "taken down or closed" : "ended after 21 days"} on {longDate(j.status === "closed" ? j.updated_at : j.expires_at ?? j.updated_at)}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}

function FoundSummary({ j }: { j: FoundRow }) {
  return (
    <>
      <h3>{j.title}</h3>
      <p className="meta">{j.employers?.clinic_name} · {j.city}, {j.province} · {employmentLabel(j.employment_type)} · {formatPay(j.pay_min, j.pay_max, j.pay_period)}</p>
      <dl className="facts">
        <div><dt>Found</dt><dd>{j.found_at ? longDate(j.found_at) : "Unknown"}{j.source_url && <> on <a href={j.source_url} target="_blank" rel="noopener noreferrer">the clinic&apos;s page<span className="sr"> (opens in a new tab)</span></a></>}</dd></div>
        <div><dt>Existing vacancy</dt><dd>{answerLabel(j.is_existing_vacancy)}</dd></div>
        <div><dt>Uses AI to screen</dt><dd>{answerLabel(j.uses_ai_screening)}</dd></div>
        <div><dt>Applications</dt><dd>{j.apply_url}</dd></div>
      </dl>
      <details>
        <summary>Summary</summary>
        <pre className="adtext">{j.description}</pre>
      </details>
    </>
  );
}
