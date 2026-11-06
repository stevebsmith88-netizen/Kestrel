import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import {
  COMPARE_CHECKED, comparePageOn, ELUTA_SPONSORED, ELUTA_URL, INDEED, INDEED_URL, JOBS4ECPS_BASIC, JOBS4ECPS_URL, LINKEDIN_URL, OJOBS_FEATURED, OJOBS_REGULAR, OJOBS_URL, over30Days,
} from "@/lib/compare-prices";
import { CLINIC_PASS, CLINIC_PASS_PLUS, dollars, perPassPost, POST_DAYS, ROLE_BANDS } from "@/lib/pricing";
import { shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: "How Kestrel's prices compare",
  description: "What it costs to advertise an eye care job on Kestrel, Jobs4ECPs, Indeed, Eluta, OJobs and LinkedIn, from public prices, with the date we checked.",
  path: "/compare",
});

const five = (rows: readonly { slots: number; each: number; total: number }[]) => rows[rows.length - 1];

export default async function Compare() {
  if (!comparePageOn()) notFound();
  const lowest = ROLE_BANDS[0].price;
  const highest = ROLE_BANDS[ROLE_BANDS.length - 1].price;
  const regular5 = five(OJOBS_REGULAR);
  const featured5 = five(OJOBS_FEATURED);
  return (
    <>
      <SiteHeader session={await getSession()} />
      <main id="main" tabIndex={-1} className="legal resources">
        <div className="wrap legal-wrap">
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
                  <th scope="row">Jobs4ECPs, Basic Single Job Posting</th>
                  <td>A listing on an eye care job board in Canada. Access to job seeker profiles for {JOBS4ECPS_BASIC.days} days at no charge.</td>
                  <td>{dollars(JOBS4ECPS_BASIC.price)} for {JOBS4ECPS_BASIC.days} days</td>
                  <td>No price for several jobs shown on the page we read.</td>
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
                <tr>
                  <th scope="row">Indeed, free post</th>
                  <td>A basic listing on a general job site.</td>
                  <td>{dollars(0)}, for up to {INDEED.freeJobsPerMonth} jobs a month, each live up to {INDEED.freeDays} days</td>
                  <td>Over the free limit, a job is sponsored (below).</td>
                </tr>
                <tr>
                  <th scope="row">Indeed, Standard sponsorship</th>
                  <td>Better visibility and automatic replies.</td>
                  <td>{dollars(INDEED.standardDaily)} a day on average, about {dollars(over30Days(INDEED.standardDaily))} over {POST_DAYS} days</td>
                  <td>You set a budget for each job. Spend follows clicks or applications.</td>
                </tr>
                <tr>
                  <th scope="row">Indeed, Premium sponsorship</th>
                  <td>Everything in Standard, plus a spotlight on the job, a first page boost and invitations to matched candidates.</td>
                  <td>{dollars(INDEED.premiumDaily)} a day on average, up to {dollars(INDEED.premiumMax30Days)} over {POST_DAYS} days</td>
                  <td>You set a budget for each job. Spend follows clicks or applications.</td>
                </tr>
                <tr>
                  <th scope="row">LinkedIn</th>
                  <td>A basic post is free. A promoted job is shown to more people and charged per click.</td>
                  <td>{dollars(0)} for a basic post. A promoted job is charged against a daily or total budget you set.</td>
                  <td>LinkedIn says the cost per click varies and is not known until the job is posted.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>How to read this</h2>
          <p>
            Eluta is a search engine that sells placement. OJobs, Jobs4ECPs and Kestrel are job boards. Indeed and LinkedIn are general job sites where a basic post is free and
            promotion is charged against a budget, so their cost depends on how much you choose to spend and how candidates respond. Kestrel adds a form that asks for the
            pay range and the 2 disclosure questions, and an applicant board for clinics. Some association and government job boards charge nothing, so it is worth checking them as well.
          </p>
          <ul>
            <li>Kestrel prices are in Canadian dollars before HST. They apply after the free launch period.</li>
            <li>A Kestrel pass renews each month at the same price until you cancel. A single post does not renew.</li>
            <li>Eluta prices are plus tax. We have not checked how the others treat tax beyond what their pages say.</li>
            <li>Indeed&apos;s figures are the daily averages its sponsoring screen showed on {COMPARE_CHECKED}. A sponsored job can cost less or more than the average.</li>
            <li>Prices can change. Please confirm on each service&apos;s own page before you buy: <a href={JOBS4ECPS_URL}>Jobs4ECPs</a>, <a href={INDEED_URL}>Indeed</a>, <a href={ELUTA_URL}>Eluta</a>, <a href={OJOBS_URL}>OJobs</a> and <a href={LINKEDIN_URL}>LinkedIn</a>.</li>
          </ul>
          <p>
            See <Link href="/clinics">how Kestrel works for clinics</Link>.
          </p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
