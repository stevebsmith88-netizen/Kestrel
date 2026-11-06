import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import {
  COMPARE_CHECKED, comparePageOn, ELUTA_SPONSORED, ELUTA_URL, INDEED, INDEED_URL, JOBS4ECPS_BASIC, JOBS4ECPS_URL, LINKEDIN_URL, OJOBS_FEATURED, OJOBS_REGULAR, OJOBS_URL, over30Days,
  ZIPRECRUITER_ESTIMATE,
} from "@/lib/compare-prices";
import { CLINIC_PASS, CLINIC_PASS_PLUS, dollars, perDay, perPassPost, POST_DAYS, ROLE_BANDS } from "@/lib/pricing";
import { shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: "How Kestrel's prices compare",
  description: "What it costs to advertise an eye care job on Kestrel, Jobs4ECPs, Indeed, Eluta, OJobs, LinkedIn and ZipRecruiter, with the date we checked.",
  path: "/compare",
});

const five = (rows: readonly { slots: number; each: number; total: number }[]) => rows[rows.length - 1];

// One row of the table: the service and a line about it, the price for 1 job, and the price when advertising 5.
function Row({ name, about, one, oneNote, five: many, manyNote, us }: { name: string; about: string; one: string; oneNote?: string; five: string; manyNote?: string; us?: boolean }) {
  return (
    <tr className={us ? "cmp-us" : undefined}>
      <th scope="row">
        {name}
        <span className="cmp-sub">{about}</span>
      </th>
      <td data-label={`1 job, ${POST_DAYS} days`}>
        <span className="cmp-price">{one}</span>
        {oneNote && <span className="cmp-sub">{oneNote}</span>}
      </td>
      <td data-label="5 jobs at once">
        <span className="cmp-price">{many}</span>
        {manyNote && <span className="cmp-sub">{manyNote}</span>}
      </td>
    </tr>
  );
}

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
            Clinics have a few places to advertise an eye care job. Here is what each one charges for a {POST_DAYS} day listing, from each service&apos;s public prices. They sell different
            things, so each line says a little about what you get.
          </p>

          <section className="card cmp-why" aria-labelledby="cmp-why-h">
            <h2 id="cmp-why-h">Why clinics choose Kestrel</h2>
            <p>Kestrel is built for eye care in Canada and nothing else, so the roles, the filters and the questions all fit the way clinics hire.</p>
            <ul>
              <li>Every post shows a pay range and answers 2 questions: is it an existing vacancy, and do you use AI to screen candidates. It is built around Ontario&apos;s rules from 1st January 2026 and British Columbia&apos;s pay range rule.</li>
              <li>A person reads every post before it goes live, and agencies cannot post, so candidates see jobs from the clinics themselves.</li>
              <li>A pay guide shows how your range compares with what is typical for the role and province, and an ad builder drafts the listing for you.</li>
              <li>Applications arrive on one board, with the CV and cover letter, and you update each candidate&apos;s status as you go.</li>
              <li>Candidates get job alerts and a &quot;Recommended for you&quot; list that shows why each job fits.</li>
            </ul>
          </section>

          <table className="table cmp" role="table">
            <caption className="sr">Price to advertise one job for {POST_DAYS} days, and the price per job when advertising 5 at once</caption>
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">1 job, {POST_DAYS} days</th>
                <th scope="col">5 jobs at once</th>
              </tr>
            </thead>
            <tbody>
              <tr className="cmp-group">
                <th scope="colgroup" colSpan={3}>Eye care job boards</th>
              </tr>
              <Row
                us
                name="Kestrel"
                about="Pay range guide, ad builder, a read through by a person and an applicant board."
                one={`${dollars(lowest)} to ${dollars(highest)}, by role`}
                five={`${perPassPost(CLINIC_PASS)} a job`}
                manyNote={`On the Clinic pass, ${dollars(CLINIC_PASS.monthly)} a month for up to ${CLINIC_PASS.livePosts} live posts. ${perPassPost(CLINIC_PASS_PLUS)} a job with optometrists included.`}
              />
              <Row
                name="Jobs4ECPs"
                about={`Access to job seeker profiles for ${JOBS4ECPS_BASIC.days} days at no charge.`}
                one={dollars(JOBS4ECPS_BASIC.price)}
                five={`${dollars(JOBS4ECPS_BASIC.price)} a job`}
                manyNote={`${dollars(JOBS4ECPS_BASIC.price * 5)} for 5 if bought one at a time. No price for several jobs is shown.`}
              />
              <Row
                name="OJobs"
                about="Regular or featured listing."
                one={`${dollars(OJOBS_REGULAR[0].each)} regular, ${dollars(OJOBS_FEATURED[0].each)} featured`}
                five={`${dollars(regular5.each)} or ${dollars(featured5.each)} a job`}
                manyNote="Regular or featured."
              />

              <tr className="cmp-group">
                <th scope="colgroup" colSpan={3}>Search engine and general job sites</th>
              </tr>
              <Row
                name="Eluta"
                about="Placed above the search results, with your logo and reporting. Candidates apply on your own site."
                one={`${dollars(ELUTA_SPONSORED[0].total)} plus tax`}
                oneNote={`${ELUTA_SPONSORED[1].days} days is ${dollars(ELUTA_SPONSORED[1].total)}, ${ELUTA_SPONSORED[2].days} days is ${dollars(ELUTA_SPONSORED[2].total)}.`}
                five={`${dollars(ELUTA_SPONSORED[0].total)} a job`}
                manyNote={`${dollars(ELUTA_SPONSORED[0].total * 5)} for 5 plus tax if bought one at a time. No price for several jobs is shown.`}
              />
              <Row
                name="Indeed"
                about="A general job site."
                one={`Free, up to ${INDEED.freeJobsPerMonth} jobs a month`}
                oneNote={`Sponsored, on average: ${dollars(INDEED.standardDaily)} a day (Standard) or ${dollars(INDEED.premiumDaily)} (Premium).`}
                five="You set a budget"
                manyNote="For each sponsored job."
              />
              <Row
                name="LinkedIn"
                about="A general job site."
                one="Free for a basic post"
                oneNote="A promoted job is charged per click."
                five="You set a budget"
                manyNote="Cost per click varies."
              />
              <Row
                name="ZipRecruiter"
                about="A general job site."
                one="No price per advert"
                oneNote="Monthly plans by live job slot, or sponsorship by the day. See the note below."
                five="Priced by plan"
              />
            </tbody>
          </table>

          <h2>How to read this</h2>
          <p>
            Eluta is a search engine that sells placement. Indeed, LinkedIn and ZipRecruiter are general job sites, where a basic post is often free and promotion is charged against a
            budget, so the cost depends on how much you spend and how candidates respond. OJobs, Jobs4ECPs and Kestrel are eye care job boards. Kestrel adds a form that asks for the
            pay range and the 2 disclosure questions, and an applicant board for clinics. Some association and government job boards charge nothing, so it is worth checking them as well.
          </p>
          <ul>
            <li>Jobs4ECPs and Eluta show no price for several jobs, so the 5 job figures assume each job is bought one at a time at the single price. They may offer packages if you ask.</li>
            <li>Kestrel prices are in Canadian dollars before HST. They apply after the free launch period.</li>
            <li>A Kestrel pass renews each month at the same price until you cancel. A single post does not renew.</li>
            <li>
              Indeed&apos;s sponsored figures are the daily averages its sponsoring screen showed on {COMPARE_CHECKED}. At that average, Standard comes to about {dollars(over30Days(INDEED.standardDaily))} over {POST_DAYS} days and
              Premium to {dollars(INDEED.premiumMax30Days)}, which is its maximum for {POST_DAYS} days. A sponsored job can cost less or more than the average.
            </li>
            <li>
              ZipRecruiter does not charge per advert. It sells a monthly subscription by the number of live job slots, and sponsorship by the day. Third party reports estimate about US${ZIPRECRUITER_ESTIMATE.monthlyLow} to
              US${ZIPRECRUITER_ESTIMATE.monthlyHigh.toLocaleString("en-CA")} a month for each live job slot, and US${ZIPRECRUITER_ESTIMATE.dailyLow} to US${ZIPRECRUITER_ESTIMATE.dailyHigh} a day for sponsorship. These are estimates, not
              ZipRecruiter&apos;s own prices, and Canadian prices may differ, so please check with ZipRecruiter.
            </li>
            <li>Eluta prices are plus tax. We have not checked how the others treat tax beyond what their pages say.</li>
            <li>
              Prices can change. Please confirm on each service&apos;s own page before you buy: <a href={JOBS4ECPS_URL}>Jobs4ECPs</a>, <a href={INDEED_URL}>Indeed</a>, <a href={ELUTA_URL}>Eluta</a>, <a href={OJOBS_URL}>OJobs</a> and{" "}
              <a href={LINKEDIN_URL}>LinkedIn</a>.
            </li>
          </ul>
          <section className="card cmp-cta" aria-labelledby="cmp-cta-h">
            <h2 id="cmp-cta-h">Why Kestrel</h2>
            <p>
              A {POST_DAYS} day post works out to {perDay(lowest)} to {perDay(highest)} a day, and the Clinic pass brings it to {perPassPost(CLINIC_PASS)} a post. For that you get a board built only for eye care, the pay range and
              both disclosure questions on every job, a person reading every post, and one place for your applicants. Clinics that take a pass during the launch keep that pass price for 12 months or until they cancel.
            </p>
            <p className="formbtns">
              <Link href="/#join" className="btn">Join the waitlist</Link>
              <Link href="/clinics" className="btn ghost">How Kestrel works for clinics</Link>
            </p>
          </section>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
