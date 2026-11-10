import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import JobCard from "@/components/JobCard";
import SiteHeader from "@/components/SiteHeader";
import type { PayGuideRow } from "@/lib/pay-guide";
import { PAGE_SIZE, type JobSummary } from "@/lib/public-jobs";

export type LandingLink = { href: string; label: string; count?: number };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

// The shared page for the province and role landing pages: a heading, the live jobs, typical pay from Job Bank, and links on to
// the nearest other pages. The job list is the same card as the search page.
export default function LandingView({
  heading,
  lede,
  crumbs,
  jobs,
  total,
  searchHref,
  empty,
  pay,
  payTitle,
  linkGroups,
  blog,
}: {
  heading: string;
  lede: string;
  crumbs: { name: string; href: string }[];
  jobs: JobSummary[];
  total: number;
  searchHref: string;
  empty: string;
  pay: PayGuideRow[];
  payTitle: string;
  linkGroups: { title: string; links: LandingLink[] }[];
  blog: { slug: string; title: string } | null;
}) {
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE}${c.href}` })),
  };
  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
      <main id="main" tabIndex={-1} className="jobsearch">
        <div className="wrap">
          <nav className="help" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={c.href}>
                {i > 0 && " / "}
                {i < crumbs.length - 1 ? <Link href={c.href}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
              </span>
            ))}
          </nav>
          <h1>{heading}</h1>
          <p className="lede2">{lede}</p>

          {jobs.length === 0 ? (
            <section className="card emptystate">
              <h2>No jobs here yet</h2>
              <p>{empty}</p>
              <p className="emptyactions">
                <Link href="/#join" className="btn">Join the waitlist</Link>{" "}
                <Link href="/jobs" className="btn ghost">Search all jobs</Link>
              </p>
            </section>
          ) : (
            <>
              <p className="resultcount" role="status">{total} {total === 1 ? "job" : "jobs"}</p>
              <div className="joblist">{jobs.map((j) => <JobCard key={j.id} job={j} />)}</div>
              {total > PAGE_SIZE && <p><Link href={searchHref} className="btn sm ghost">See all {total} jobs</Link></p>}
            </>
          )}

          {pay.length > 0 && (
            <section className="card landpay" aria-labelledby="land-pay">
              <h2 id="land-pay">{payTitle}</h2>
              <ul className="paylist">
                {pay.map((r) => (
                  <li key={r.role}>
                    <strong>{r.role}</strong>
                    <span>Median {r.median}{r.yearly ? `. ${r.yearly}` : ""}</span>
                    <span>Middle half of pay: {r.middleHalf}</span>
                  </li>
                ))}
              </ul>
              <p className="help">
                Typical pay from Job Bank, the Government of Canada&apos;s labour market service (Open Government Licence, Canada). It is guidance, not what any one clinic pays. See <Link href="/resources#pay">typical pay in every province</Link>.
              </p>
            </section>
          )}

          {linkGroups.filter((g) => g.links.length > 0).map((g) => (
            <section key={g.title}>
              <h2>{g.title}</h2>
              <ul className="landlinks">
                {g.links.map((l) => (
                  <li key={l.href}><Link href={l.href}>{l.label}{l.count ? <span className="count">({l.count})</span> : null}</Link></li>
                ))}
              </ul>
            </section>
          ))}

          {blog && <p className="help">Worth a read: <Link href={`/blog/${blog.slug}`}>{blog.title}</Link></p>}
          <p className="help"><Link href="/eye-care-jobs" className="btn sm ghost">Browse eye care jobs by province and role</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
