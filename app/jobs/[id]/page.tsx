import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import ApplyLink from "@/components/ApplyLink";
import JobViewBeacon from "@/components/JobViewBeacon";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { answerLabel, employmentLabel, jobPostingJsonLd, longDate, practiceLabel } from "@/lib/jobs";
import { estimateText, payChips, payText } from "@/lib/job-pay";
import { TAG_GROUPS, tagsFromRow } from "@/lib/job-tags";
import { getLiveJob } from "@/lib/public-jobs";
import { shareMetadata } from "@/lib/share";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getLiveJob(id);
  if (!job) return { title: "Job not found | Kestrel Eye Care Jobs", robots: { index: false } };
  const where = `${job.city}, ${job.province}`;
  const clinic = job.employers?.clinic_name ?? "a clinic";
  return shareMetadata({
    title: `${job.title} at ${clinic}, ${where}`,
    shareTitle: `${job.title} at ${clinic}`,
    description: `${job.title} in ${where}. ${payText(job)}.`,
    path: `/jobs/${job.id}`,
  });
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getLiveJob(id);
  if (!job) notFound();
  const clinic = job.employers;
  // Structured data is only added while the job is live, and it matches what is on the page. A found listing that the clinic
  // has not claimed gets none: the clinic's own page is the original, and Kestrel cannot know the moment the job is filled
  // (audit finding R19, decision (a)). It still shows on Kestrel and in Kestrel's own search.
  const unclaimedFound = job.is_seeded && !clinic?.claimed;
  const jsonLd = clinic && !unclaimedFound ? jobPostingJsonLd(job, clinic, SITE) : null;

  return (
    <>
      <SiteHeader session={await getSession()} />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <main id="main" tabIndex={-1} className="jobpage">
        <JobViewBeacon jobId={job.id} />
        <div className="wrap">
          <p className="back"><Link href="/jobs">Back to all jobs</Link></p>
          <header className="jobhead">
            <h1>{job.title}</h1>
            <p className="meta">{clinic?.clinic_name} · {job.city}, {job.province}</p>
            <p className="chips">
              <span className="chip">{employmentLabel(job.employment_type)}</span>
              {payChips(job).map((c) => <span className="chip paychip" key={c}>{c}</span>)}
              <span className="chip">{practiceLabel(clinic?.practice_type)}</span>
              {job.work_arrangement === "field" && <span className="chip">Field based</span>}
            </p>
            {job.is_seeded && !clinic?.claimed && (
              <p className="seedlabel">Found on the clinic&apos;s website, not yet claimed. <Link href={`/jobs/${job.id}/claim`}>Is this your clinic? Claim this listing</Link></p>
            )}
          </header>

          <div className="jobgrid">
            <div className="jobmain">
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
              <section className="card jobfacts">
                <h2>Job facts</h2>
                <dl className="facts">
                  <div className="wide"><dt>Pay</dt><dd>{payText(job)}</dd></div>
                  {estimateText(job) && <div className="wide"><dt>Yearly estimate</dt><dd>{estimateText(job)}</dd></div>}
                  <div><dt>Type</dt><dd>{employmentLabel(job.employment_type)}</dd></div>
                  {TAG_GROUPS.map((g) => {
                    const names = tagsFromRow(job)[g.key];
                    return names.length > 0 ? <div key={g.key}><dt>{g.label}</dt><dd>{names.join(", ")}</dd></div> : null;
                  })}
                  {job.pay_extras && <div><dt>Also part of the pay</dt><dd>{job.pay_extras}</dd></div>}
                  <div><dt>{job.work_arrangement === "field" ? "Based in" : "Location"}</dt><dd>{job.city}, {job.province}</dd></div>
                  {job.work_arrangement === "field" && job.territory && <div><dt>Area covered</dt><dd>{job.territory}</dd></div>}
                  <div><dt>Existing vacancy</dt><dd>{answerLabel(job.is_existing_vacancy)}</dd></div>
                  <div><dt>Uses AI to screen candidates</dt><dd>{answerLabel(job.uses_ai_screening)}</dd></div>
                  <div><dt>Posted</dt><dd>{longDate(job.posted_at)}</dd></div>
                  <div><dt>Closes</dt><dd>{longDate(job.expires_at)}</dd></div>
                </dl>
              </section>
            </div>

            <aside className="jobaside">
              <section className="card applybox">
                <h2>Apply</h2>
                {job.apply_method === "external" && job.apply_url ? (
                  <>
                    <p>Applications are made on the clinic&apos;s own website.</p>
                    <ApplyLink jobId={job.id} href={job.apply_url} external>Apply on the clinic&apos;s website<span className="sr"> (opens in a new tab)</span></ApplyLink>
                  </>
                ) : (
                  <>
                    <p>Use your saved CV and, if you like, a short cover note. It takes about a minute, and you can follow your application as the employer reviews it.</p>
                    <p className="help">Your profile stays private. The clinic sees only what you send with this application.</p>
                    <ApplyLink jobId={job.id} href={`/jobs/${job.id}/apply`}>Quick Apply</ApplyLink>
                  </>
                )}
              </section>
              <p className="reportlink"><Link href={`/jobs/${job.id}/report`}>Report this job</Link></p>
            </aside>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
