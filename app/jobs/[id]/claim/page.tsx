import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import ClaimForm from "@/components/ClaimForm";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { hostOf } from "@/lib/claims";
import { formatPay, longDate } from "@/lib/jobs";
import { getLiveJob } from "@/lib/public-jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Claim your listing | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const STEPS = [
  ["Create your clinic account", "Choose “I’m hiring for a clinic” and use your work email."],
  ["Confirm you represent the clinic", "We send a link to an email address at your clinic’s own website."],
  ["Check the details", "Fix anything we got wrong and add your pay range if it was missing."],
  ["We take a quick look", "Our team checks every claim, usually within 1 business day."],
];

export default async function ClaimListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getLiveJob(id);
  if (!job) notFound();
  const clinic = job.employers;
  const session = await getSession();
  const here = `/jobs/${job.id}/claim`;
  const claimed = !clinic || clinic.claimed;
  const host = hostOf(clinic?.website);
  const found = Math.max(0, Math.floor((Date.now() - new Date(job.posted_at).getTime()) / 86_400_000));

  // Has this person already started a claim?
  let open: string | null = null;
  const admin = supabaseAdmin();
  if (session?.role === "clinic" && admin) {
    const { data } = await admin.from("listing_claims").select("status").eq("employer_id", job.employer_id).eq("user_id", session.userId).in("status", ["pending_email", "pending_review"]).maybeSingle();
    open = data?.status ?? null;
  }

  const removeLink = `mailto:hello@eyecarejobs.ca?subject=${encodeURIComponent("Please remove a listing")}&body=${encodeURIComponent(`Please remove this listing: https://eyecarejobs.ca/jobs/${job.id}\n\nMy name and role at the clinic:\n`)}`;

  return (
    <>
      <SiteHeader session={session} />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap">
          <p className="back"><Link href={`/jobs/${job.id}`}>Back to the job</Link></p>
          <p className="kicker">For clinics</p>
          <h1>Is this your clinic? Claim your listing</h1>
          <p className="lede2">We found this job on your own website. Claim it to take control of the listing, for free during our launch.</p>

          <div className="claimgrid">
            <div className="stackcards">
              <section className="seedcard" aria-label="The listing we found">
                <p className="seedlabel">{claimed ? "This listing has been claimed" : "Found on the clinic's website, not yet claimed"}</p>
                <h2>{job.title}</h2>
                <p className="meta">{clinic?.clinic_name} · {job.city}, {job.province}</p>
                <p className="chips"><span className="chip">{job.employment_type}</span><span className="chip paychip">{formatPay(job.pay_min, job.pay_max, job.pay_period)}</span></p>
                <p className="help">Details are in our own words, from your careers page. Applicants are sent to your application page. Found {found === 0 ? "today" : found === 1 ? "1 day ago" : `${found} days ago`}. {claimed ? "" : `This listing is removed automatically on ${longDate(job.expires_at)} if it is not claimed.`}</p>
              </section>

              <section className="card">
                <h2>What claiming gives you</h2>
                <ul className="plainlist">
                  <li>Your clinic as the owner of the listing, instead of “not yet claimed”</li>
                  <li>Applications arrive in your dashboard, with the applicant’s CV and cover letter</li>
                  <li>You can close the job whenever you like, and post new ones</li>
                  <li>Your contact details stay private, because applicants write to you through Kestrel</li>
                </ul>
              </section>

              <section className="card">
                <h2>How it works</h2>
                <ol className="how">
                  {STEPS.map(([title, body], i) => (
                    <li key={title}><span className="n" aria-hidden="true">{i + 1}</span><div><strong>{title}</strong><div className="help">{body}</div></div></li>
                  ))}
                </ol>
              </section>
            </div>

            <aside className="stackcards" aria-label="Claim form">
              {claimed ? (
                <div className="card"><h3>Already claimed</h3><p>This listing now belongs to a clinic account. If that is a mistake, please email <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a>.</p></div>
              ) : !session ? (
                <div className="card">
                  <h3>Start your claim</h3>
                  <p>You will need a free clinic account first.</p>
                  <div className="formbtns">
                    <Link href="/sign-up?type=clinic" className="btn">Create a clinic account</Link>
                    <Link href={`/sign-in?next=${encodeURIComponent(here)}`} className="btn ghost">I already have one</Link>
                  </div>
                  <p className="help">After you create your account, confirm your email, then come back to this page and press “I already have one” to sign in.</p>
                </div>
              ) : session.role !== "clinic" ? (
                <div className="card"><h3>You need a clinic account</h3><p>You are signed in as {session.role === "admin" ? "an admin" : "a candidate"}. Claiming a listing needs a clinic account. Sign out and create one with your work email.</p></div>
              ) : open === "pending_review" ? (
                <div className="card" role="status"><h3>Your claim is with our team</h3><p>We will email you, usually within 1 business day.</p></div>
              ) : (
                <>
                  {open === "pending_email" && <p className="notice" role="status">We have already sent you a link. You can send a new one below.</p>}
                  <ClaimForm jobId={job.id} defaultEmail="" host={host} />
                </>
              )}
              <div className="card paper">
                <h3>Not your clinic?</h3>
                <p className="help">If this should not be listed, or you would like it taken down, tell us and we will remove it promptly.</p>
                <a className="btn ghost block" href={removeLink}>Ask us to remove it</a>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
