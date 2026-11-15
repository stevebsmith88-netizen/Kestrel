import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import JobCard from "@/components/JobCard";
import Icon from "@/components/Icon";
import SiteHeader from "@/components/SiteHeader";
import { clinicJsonLd, openJobsText, type PublicClinic } from "@/lib/clinic-pages";
import { practiceLabel } from "@/lib/jobs";
import type { JobSummary } from "@/lib/public-jobs";
import { socialLinksFrom } from "@/lib/social-links";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

// The public page of a clinic (/clinics) or a supplier (/companies): who they are and every job they have open. Drawn signed out and
// saved for everyone, like job pages, so it never holds anything about the person looking.
export default function EmployerPage({ clinic, slug, jobs, confirmed = false, founding = false }: { clinic: PublicClinic; slug: string; jobs: JobSummary[]; confirmed?: boolean; founding?: boolean }) {
  const supplier = clinic.practice_type === "supplier";
  const jsonLd = clinicJsonLd(clinic, slug, SITE);
  const socials = socialLinksFrom(clinic);
  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main id="main" tabIndex={-1} className="clinicpage">
        <div className="wrap">
          <p className="back"><Link href={supplier ? "/jobs?arrangement=field" : "/jobs"}>Back to all jobs</Link></p>
          <header className="jobhead clinichead">
            <div className="clinicid">
              <h1>{clinic.clinic_name}</h1>
              <p className="meta">{supplier ? `Canadian office: ${clinic.city}, ${clinic.province}` : `${clinic.city}, ${clinic.province}`}</p>
              <p className="chips">
                <span className="chip">{practiceLabel(clinic.practice_type)}</span>
                <span className="chip">{openJobsText(jobs.length)}</span>
                {confirmed && <span className="chip">Company email confirmed</span>}
                {founding && <span className="chip">Founding clinic</span>}
              </p>
            </div>
            {(clinic.website || socials.length > 0) && (
              <div className="clinicactions">
                {clinic.website && (
                  <a href={clinic.website} className="btn sm ghost" target="_blank" rel="noopener nofollow">Visit their website<span className="sr"> (opens in a new tab)</span></a>
                )}
                {socials.length > 0 && (
                  <ul className="clinic-social" aria-label={`${clinic.clinic_name} on social media`}>
                    {socials.map((s) => (
                      <li key={s.key}>
                        <a href={s.url} target="_blank" rel="noopener nofollow noreferrer" aria-label={`${clinic.clinic_name} on ${s.name} (opens in a new tab)`}>
                          <Icon name={s.key} />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
              <p>{clinic.clinic_name} has nothing open on Kestrel today. <Link href={supplier ? "/jobs?arrangement=field" : `/jobs?province=${encodeURIComponent(clinic.province)}`}>{supplier ? "See other field based jobs" : `See other jobs in ${clinic.province}`}</Link>.</p>
            )}
          </section>
          {confirmed && <p className="help">&quot;Company email confirmed&quot; means the person who runs this page signed in with an email address at the company&apos;s own website.</p>}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
