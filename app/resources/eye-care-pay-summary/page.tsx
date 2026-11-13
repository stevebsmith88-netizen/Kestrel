import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { JOB_BANK_SOURCE } from "@/lib/pay-benchmark-data";
import { LICENCE_STATEMENT, LICENCE_URL, plainDate } from "@/lib/pay-benchmark";
import { money, provincesOnTop, roleSummaries, yearly } from "@/lib/pay-summary";
import { shareMetadata } from "@/lib/share";

// Saved once and shown to everyone, then built again at most every 5 minutes (audit P1-10). force-static means that even if something on
// the page tried to read who is visiting, it would see nobody, so a saved page can never hold anything about a person.
export const revalidate = 300;
export const dynamic = "force-static";

export const metadata: Metadata = shareMetadata({
  title: "Eye care pay in Canada: the 2026 summary",
  description: "Where pay is highest and lowest for opticians, optometric assistants, patient care staff and clinic managers in each province, from Job Bank figures.",
  path: "/resources/eye-care-pay-summary",
});

// Change this, and PAGE_DATES.paySummary in lib/page-dates.ts, when the Job Bank figures are refreshed each year (docs/pay-benchmark.md).
const UPDATED = "13th November 2026";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

const PLAIN_ROLE: Record<string, string> = {
  Optician: "opticians",
  "Optometric assistant or technician": "optometric assistants and technicians",
  "Patient care or reception": "patient care and reception staff",
  "Practice or clinic manager": "practice and clinic managers",
};

export default function PaySummary() {
  const rows = roleSummaries();
  const top = provincesOnTop();
  const leader = top[0];
  const widest = [...rows].sort((a, b) => b.gapPercent - a.gapPercent)[0];
  const others = rows.filter((r) => r !== widest).map((r) => r.gapPercent);
  const otherRange = Math.min(...others) === Math.max(...others) ? `${Math.min(...others)}%` : `between ${Math.min(...others)}% and ${Math.max(...others)}%`;
  const closestRoles = rows.filter((r) => r.closest).map((r) => PLAIN_ROLE[r.role]);
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Eye care pay in Canada: the 2026 summary",
    datePublished: "2026-11-13",
    dateModified: "2026-11-13",
    author: { "@type": "Organization", name: "Kestrel Eye Care Jobs", url: SITE },
    publisher: { "@type": "Organization", name: "Kestrel Eye Care Jobs", logo: { "@type": "ImageObject", url: `${SITE}/brand/kestrel-lockup-full.png` } },
    isBasedOn: JOB_BANK_SOURCE.dataset,
    mainEntityOfPage: `${SITE}/resources/eye-care-pay-summary`,
  };
  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, "\\u003c") }} />
      <main id="main" tabIndex={-1} className="legal">
        <div className="wrap legal-wrap">
          <h1>Eye care pay in Canada: the 2026 summary</h1>
          <p className="updated">Last updated {UPDATED}</p>

          <p>
            Once a year, when Job Bank publishes new wage figures, we pull out what they say about eye care: where each role is paid most and least, and how wide the gap is.
            The figures are typical hourly pay (the median) from the Government of Canada&apos;s Job Bank, revised on {plainDate(JOB_BANK_SOURCE.revised)}. Every number here also appears in our <Link href="/resources#pay">pay table</Link>, province by province.
          </p>

          <h2>The short version</h2>
          <p>
            {leader.province} has the highest median for {leader.roles} of the {rows.length} roles below.
            The gap between provinces is widest for {PLAIN_ROLE[widest.role]}, at {widest.gapPercent}% between the top and the bottom. For the other roles it is {otherRange}.
            Optometrists are left out, because Job Bank&apos;s figures for them come from the 2021 census and mix in part time and self employed work. Quebec is left out while Kestrel is in English only.
          </p>

          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Role</th>
                  <th scope="col">Highest median</th>
                  <th scope="col">Lowest median</th>
                  <th scope="col">Gap</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.role}>
                    <th scope="row">{r.role}{r.closest ? " (closest group)" : ""}</th>
                    <td>{money(r.highest.median)} an hour, {r.highest.province}</td>
                    <td>{money(r.lowest.median)} an hour, {r.lowest.province}</td>
                    <td>{money(r.gap)} an hour ({r.gapPercent}%)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Each figure covers the {rows[0].provinces} provinces where Job Bank publishes one for that role. Prince Edward Island and the territories have no published figure.
          </p>

          <h2>What it comes to over a year</h2>
          <p>
            At 40 hours a week, every week of the year, the top and bottom optician medians come to about {yearly(rows[0].highest.median)} in {rows[0].highest.province} and {yearly(rows[0].lowest.median)} in {rows[0].lowest.province}.
            These are our own sums, before tax and without benefits, commission or an eyewear allowance. Many people in eye care work 4 longer days, or part time, so the hourly figure is the fairer one to compare.
          </p>

          <h2>How to read these numbers</h2>
          <p>
            A median is the middle figure: half the people surveyed earned more and half earned less. It says nothing about a particular clinic, and Job Bank does not say how many people each figure is based on, so treat the smaller provinces as a rough guide.
            Job Bank groups people by the work they do. For {closestRoles.slice(0, -1).join(", ")}{closestRoles.length > 1 ? " and " : ""}{closestRoles[closestRoles.length - 1]}, there is no group named for eye care, so we used the closest one and say so in the table.
            Job Bank does not explain why a province is high or low, and neither do we: local demand, the mix of clinics and who is counted all play a part.
          </p>
          <p>
            If you are looking at an offer, see where it sits against the full range for your province in the <Link href="/resources#pay">pay table</Link>. If you are hiring, our <Link href="/blog/eye-care-job-ad-checklist">job ad checklist</Link> covers what to put in the ad,
            including the pay range several provinces now ask for.
          </p>

          <h2>Using this page</h2>
          <p>
            You are welcome to quote these figures. Please credit Job Bank as the source and link to this page. We update it each year when Job Bank revises its figures, and the date at the top says when it was last done.
          </p>
          <p className="note">
            Source: <a href={JOB_BANK_SOURCE.dataset} rel="noopener noreferrer">{JOB_BANK_SOURCE.name}</a>, revised {plainDate(JOB_BANK_SOURCE.revised)}. {LICENCE_STATEMENT} (<a href={LICENCE_URL} rel="noopener noreferrer">licence</a>). Adapted by Kestrel, and not endorsed by the Government of Canada.
          </p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
