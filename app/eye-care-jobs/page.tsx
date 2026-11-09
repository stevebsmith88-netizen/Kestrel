import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { LANDING_PROVINCES, LANDING_ROLES, landingIndexable, provinceHref } from "@/lib/landing";
import { getFilterCounts } from "@/lib/public-jobs";
import { shareMetadata } from "@/lib/share";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { total } = await getFilterCounts();
  return {
    ...shareMetadata({
      title: "Eye care jobs in Canada, by province and role",
      description: "Browse eye care jobs across Canada by province and role. Every job shows its pay, and a person reads every post before it goes live.",
      path: "/eye-care-jobs",
    }),
    ...(landingIndexable(total) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function Hub() {
  const counts = await getFilterCounts();
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="jobsearch">
        <div className="wrap">
          <h1>Eye care jobs in Canada, by province and role</h1>
          <p className="lede2">Pick a province to see its eye care jobs, or a role to see where it is hiring. Every job shows its pay.</p>
          <section>
            <h2>By province</h2>
            <ul className="landlinks">
              {LANDING_PROVINCES.map((p) => (
                <li key={p}><Link href={provinceHref(p)}>{p}{counts.provinces[p] ? <span className="count">({counts.provinces[p]})</span> : null}</Link></li>
              ))}
            </ul>
          </section>
          <section>
            <h2>By role</h2>
            <ul className="landlinks">
              {LANDING_ROLES.map((r) => (
                <li key={r.slug}><Link href={`/jobs?role=${encodeURIComponent(r.role)}`}>{r.name}{counts.roles[r.role] ? <span className="count">({counts.roles[r.role]})</span> : null}</Link></li>
              ))}
            </ul>
          </section>
          <p className="help">Looking for something specific? <Link href="/jobs">Search all jobs</Link>. Kestrel is in English for now, so Quebec jobs are not listed yet.</p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
