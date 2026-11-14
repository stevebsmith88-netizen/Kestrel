import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import JobCard from "@/components/JobCard";
import SiteHeader from "@/components/SiteHeader";
import { clinicHref, clinicIndexable, clinicJsonLd, openJobsText } from "@/lib/clinic-pages";
import { practiceLabel } from "@/lib/jobs";
import { getPublicClinic } from "@/lib/public-clinics";
import { listLiveJobsForEmployer } from "@/lib/public-jobs";
import { shareMetadata } from "@/lib/share";

// A clinic's public page: who they are and every job they have open (Steve, 14th November 2026). Saved and shared for up to 5 minutes and
// cleared at once when a job or a clinic changes (lib/job-cache.ts), like job pages, so it never holds anything about the person looking.
export const revalidate = 300;
export const dynamic = "force-static";
export const generateStaticParams = () => [];

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const found = await getPublicClinic((await params).slug);
  if (!found) return { title: "Clinic not found | Kestrel Eye Care Jobs", robots: { index: false } };
  const { clinic, slug } = found;
  const jobs = await listLiveJobsForEmployer(clinic.id);
  const where = `${clinic.city}, ${clinic.province}`;
  return {
    ...shareMetadata({
      title: `${clinic.clinic_name}, ${where}: eye care jobs`,
      shareTitle: `Work at ${clinic.clinic_name}`,
      description: `${clinic.clinic_name} in ${where}. ${openJobsText(jobs.length)} on Kestrel Eye Care Jobs, every one with its pay.`,
      path: clinicHref(slug),
    }),
    ...(clinicIndexable(clinic.about, jobs.length) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function ClinicPage({ params }: { params: Promise<{ slug: string }> }) {
  const found = await getPublicClinic((await params).slug);
  if (!found) notFound();
  const { clinic, slug } = found;
  const jobs = await listLiveJobsForEmployer(clinic.id);
  const jsonLd = clinicJsonLd(clinic, slug, SITE);
  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main id="main" tabIndex={-1} className="clinicpage">
        <div className="wrap">
          <p className="back"><Link href="/jobs">Back to all jobs</Link></p>
          <header className="jobhead">
            <h1>{clinic.clinic_name}</h1>
            <p className="meta">{clinic.city}, {clinic.province}</p>
            <p className="chips">
              <span className="chip">{practiceLabel(clinic.practice_type)}</span>
              <span className="chip">{openJobsText(jobs.length)}</span>
            </p>
            {clinic.website && (
              <p><a href={clinic.website} className="btn sm ghost" target="_blank" rel="noopener nofollow">Visit their website<span className="sr"> (opens in a new tab)</span></a></p>
            )}
          </header>

          {clinic.about && (
            <section className="card">
              <h2>About {clinic.clinic_name}</h2>
              <div className="adbody">{clinic.about}</div>
            </section>
          )}

          <section className="clinicjobs" aria-labelledby="open-jobs">
            <h2 id="open-jobs">{jobs.length ? `Jobs open at ${clinic.clinic_name}` : "No open jobs right now"}</h2>
            {jobs.length ? (
              jobs.map((j) => <JobCard key={j.id} job={j} />)
            ) : (
              <p>{clinic.clinic_name} has nothing open on Kestrel today. <Link href={`/jobs?province=${encodeURIComponent(clinic.province)}`}>See other jobs in {clinic.province}</Link>.</p>
            )}
          </section>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
