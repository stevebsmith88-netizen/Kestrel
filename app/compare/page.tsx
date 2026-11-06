import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { COMPARE_CHECKED, comparePageOn, ELUTA_SPONSORED, ELUTA_URL, OJOBS_FEATURED, OJOBS_REGULAR, OJOBS_URL } from "@/lib/compare-prices";
import { CLINIC_PASS, CLINIC_PASS_PLUS, dollars, perPassPost, POST_DAYS, ROLE_BANDS } from "@/lib/pricing";
import { shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: "How Kestrel's prices compare",
  description: "What it costs to advertise an eye care job on Kestrel, Eluta and OJobs, from each service's public prices, with the date we checked.",
  path: "/compare",
});

const five = (rows: readonly { slots: number; each: number; total: number }[]) => rows[rows.length - 1];

export default async function Compare() {
  if (!comparePageOn()) notFound();
  const live = process.env.VERCEL_ENV === "production";
  const lowest = ROLE_BANDS[0].price;
  const highest = ROLE_BANDS[ROLE_BANDS.length - 1].price;
  const regular5 = five(OJOBS_REGULAR);
  const featured5 = five(OJOBS_FEATURED);
  return (
    <>
      <SiteHeader session={await getSession()} />
      <main id="main" tabIndex={-1} className="legal resources">
        <div className="wrap legal-wrap">
          {!live && <p className="notice" role="note">Preview only. This page is switched off on the live site until it is turned on.</p>}
          <h1>How Kestrel&apos;s prices compare</h1>
          <p className="updated">Prices checked {COMPARE_CHECKED}</p>
          <p>
            Clinics have a few places to advertise an eye care job. Here is what each one charges for a 30 day listing, taken from each service&apos;s public prices. The
            services sell different things, so the table says what you get as well as what you pay.
          </p>

          <div className="tablewrap">
            <table className="table cmp">
              <caption>Price to advertise one job, and the price per job when you advertise 5 at once</caption>
              <thead>
                <tr>
                  <th scope="col">Service</th>
                  <th scope="col">What you get</th>
                  <th scope="col">1 job, {POST_DAYS} days</th>
                  <th scope="col">5 jobs at once</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Kestrel</th>
                  <td>A post on an eye care job board, with a pay range guide, an ad builder, a read through by a person, and an applicant board.</td>
                  <td>{dollars(lowest)}, {dollars(ROLE_BANDS[1].price)} or {dollars(highest)}, by role</td>
                  <td>
                    {perPassPost(CLINIC_PASS)} a job on the Clinic pass ({dollars(CLINIC_PASS.monthly)} a month for up to {CLINIC_PASS.livePosts} live posts).
                    {" "}{perPassPost(CLINIC_PASS_PLUS)} a job with optometrists included ({dollars(CLINIC_PASS_PLUS.monthly)} a month).
                  </td>
                </tr>
                <tr>
                  <th scope="row">Eluta, Sponsored Job</th>
                  <td>A job placed above the search results in a Canada wide job search engine, with your logo and reporting. Candidates apply on your own site.</td>
                  <td>
                    {dollars(ELUTA_SPONSORED[0].total)} for 30 days. {ELUTA_SPONSORED[1].days} days is {dollars(ELUTA_SPONSORED[1].total)} and {ELUTA_SPONSORED[2].days} days is {dollars(ELUTA_SPONSORED[2].total)}. Plus tax.
                  </td>
                  <td>No price for several jobs shown on the page we read.</td>
                </tr>
                <tr>
                  <th scope="row">OJobs, regular slot</th>
                  <td>A listing on an optical job board.</td>
                  <td>{dollars(OJOBS_REGULAR[0].each)}</td>
                  <td>{dollars(regular5.each)} a job ({dollars(regular5.total)} in all)</td>
                </tr>
                <tr>
                  <th scope="row">OJobs, featured slot</th>
                  <td>A featured listing on the same board.</td>
                  <td>{dollars(OJOBS_FEATURED[0].each)}</td>
                  <td>{dollars(featured5.each)} a job ({dollars(featured5.total)} in all)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>How to read this</h2>
          <p>
            Eluta is a search engine that sells placement. OJobs and Kestrel are job boards. Kestrel adds a form that asks for the pay range and the 2 disclosure questions, and
            an applicant board for clinics. Some association and government job boards charge nothing, so it is worth checking them as well.
          </p>
          <ul>
            <li>Kestrel prices are in Canadian dollars before HST. They apply after the free launch period.</li>
            <li>A Kestrel pass renews each month at the same price until you cancel. A single post does not renew.</li>
            <li>Eluta prices are plus tax. We have not checked how OJobs and Eluta treat tax beyond what their pages say.</li>
            <li>Prices can change. Please confirm on each service&apos;s own page before you buy: <a href={ELUTA_URL}>Eluta</a> and <a href={OJOBS_URL}>OJobs</a>.</li>
          </ul>
          <p>
            Kestrel is not connected to Eluta or OJobs. See <Link href="/clinics">how Kestrel works for clinics</Link>.
          </p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
