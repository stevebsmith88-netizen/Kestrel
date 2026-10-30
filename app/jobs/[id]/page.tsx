import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { formatPay, jobPostingJsonLd, longDate } from "@/lib/jobs";
import { getLiveJob } from "@/lib/public-jobs";

export const revalidate = 60;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getLiveJob(id);
  if (!job) return { title: "Job not found | Kestrel Eye Care Jobs", robots: { index: false } };
  const where = `${job.city}, ${job.province}`;
  return {
    title: `${job.title} at ${job.employers?.clinic_name ?? "a clinic"}, ${where} | Kestrel Eye Care Jobs`,
    description: `${job.title} in ${where}. ${formatPay(job.pay_min, job.pay_max, job.pay_period)}.`,
    alternates: { canonical: `/jobs/${job.id}` },
  };
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getLiveJob(id);
  if (!job) notFound();
  const clinic = job.employers;
  // Structured data is only added while the job is live, and it matches what is on the page.
  const jsonLd = clinic ? jobPostingJsonLd(job, clinic, SITE) : null;

  return (
    <>
      <SiteHeader />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <main id="main" tabIndex={-1} className="jobpage">
        <div className="wrap">
          <p className="back"><Link href="/jobs">Back to all jobs</Link></p>
          <header className="jobhead">
            <h1>{job.title}</h1>
            <p className="meta">{clinic?.clinic_name} · {job.city}, {job.province}</p>
            <p className="chips">
              <span className="chip">{job.employment_type}</span>
              <span className="chip paychip">{formatPay(job.pay_min, job.pay_max, job.pay_period)}</span>
              <span className="chip">{clinic?.practice_type === "corporate" ? "Corporate" : "Independent"}</span>
            </p>
            {job.is_seeded && <p className="seedlabel">Found on the clinic&apos;s website, not yet claimed</p>}
          </header>

          <div className="jobgrid">
            <section className="card">
              <h2>About the job</h2>
              <div className="adbody">{job.description}</div>
              {clinic?.about && (
                <>
                  <h2>About {clinic.clinic_name}</h2>
                  <div className="adbody">{clinic.about}</div>
                </>
              )}
            </section>

            <aside className="jobaside">
              <section className="card applybox">
                <h2>Apply</h2>
                {job.apply_method === "external" && job.apply_url ? (
                  <>
                    <p>Applications are made on the clinic&apos;s own website.</p>
                    <a href={job.apply_url} className="btn" target="_blank" rel="nofollow noopener noreferrer">Apply on the clinic&apos;s website</a>
                  </>
                ) : (
                  <>
                    <p>Apply with your saved CV and a short cover letter. It takes a couple of minutes, and you can follow your application as the clinic reviews it.</p>
                    <Link href={`/jobs/${job.id}/apply`} className="btn">Apply with Kestrel</Link>
                  </>
                )}
              </section>
              <section className="card">
                <h2>Job facts</h2>
                <dl className="facts">
                  <div><dt>Pay</dt><dd>{formatPay(job.pay_min, job.pay_max, job.pay_period)}</dd></div>
                  <div><dt>Type</dt><dd>{job.employment_type}</dd></div>
                  <div><dt>Location</dt><dd>{job.city}, {job.province}</dd></div>
                  <div><dt>Existing vacancy</dt><dd>{job.is_existing_vacancy ? "Yes" : "No"}</dd></div>
                  <div><dt>Uses AI to screen candidates</dt><dd>{job.uses_ai_screening ? "Yes" : "No"}</dd></div>
                  <div><dt>Posted</dt><dd>{longDate(job.posted_at)}</dd></div>
                  <div><dt>Closes</dt><dd>{longDate(job.expires_at)}</dd></div>
                </dl>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
