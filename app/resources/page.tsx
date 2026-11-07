import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import DirectoryTable from "@/components/DirectoryTable";
import PayGuide from "@/components/PayGuide";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { DIRECTORY, DIRECTORY_CATEGORIES, DIRECTORY_CHECKED } from "@/lib/directory-data";
import { findYourFitOn } from "@/lib/features";
import { JOB_BANK_SOURCE } from "@/lib/pay-benchmark-data";
import { LICENCE_STATEMENT, LICENCE_URL, plainDate } from "@/lib/pay-benchmark";
import { payGuide, payGuideProvinces } from "@/lib/pay-guide";
import { listedGroups } from "@/lib/resources";
import { shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: "Eye care resources for Canada",
  description: "Typical pay by province and role, the rules behind an eye care job ad, a directory of Canadian eye care suppliers and organisations, and links to the associations and regulators.",
  path: "/resources",
});

const UPDATED = "9th November 2026";

export default async function Resources() {
  const provinces = payGuideProvinces();
  const groups = listedGroups();
  return (
    <>
      <SiteHeader session={await getSession()} />
      <main id="main" tabIndex={-1} className="legal resources">
        <div className="wrap legal-wrap">
          <h1>Eye care resources for Canada</h1>
          <p className="updated">Last updated {UPDATED}</p>
          <p>
            A page for people who work in eye care and the clinics that hire them: typical pay by province, the rules behind a job ad, a directory of suppliers and organisations, and links to the
            bodies that license and represent the profession.
          </p>

          <h2 id="pay">What eye care roles typically pay</h2>
          <p>Choose a province to see the median and the middle half of pay for each role. The figures come from Job Bank, the Government of Canada&apos;s labour market service.</p>
          <PayGuide provinces={provinces} rows={payGuide()} initial={provinces.includes("Ontario") ? "Ontario" : provinces[0]} />
          <p className="help">
            The median is the middle figure: half of workers earn more and half earn less. The middle half of pay runs from the first quartile to the third.
            Hourly roles also show a yearly amount, worked out over a 2,080 hour year. Where a role has no exact Job Bank group, we use the closest one and say so.
            A province is left out where Job Bank publishes no figure, usually
            because the numbers are small.
          </p>
          <p className="help">
            Guidance only. Pay in your town and at your clinic can differ. Source: {JOB_BANK_SOURCE.name}, file of {plainDate(JOB_BANK_SOURCE.revised)} (
            <a href={JOB_BANK_SOURCE.dataset}>dataset</a>). {LICENCE_STATEMENT} (<a href={LICENCE_URL}>licence</a>). Adapted by Kestrel, and not endorsed by the Government of Canada.
          </p>

          <h2 id="hiring-rules">Hiring rules that affect a job ad</h2>
          <p>
            Rules differ by province and by the size of the employer. These are the ones behind what Kestrel asks of every post, wherever the clinic is. This is general
            information, not legal advice, so check the current rules for your province or ask a lawyer.
          </p>
          <ul>
            <li>A pay range, as a yearly salary or an hourly rate. It can be no more than $50,000 wide unless the top of the range is over $200,000 a year. This covers Ontario&apos;s rules from 1st January 2026, which apply to employers with 25 or more employees, and British Columbia&apos;s pay range rule.</li>
            <li>Whether the job is an existing vacancy, yes or no.</li>
            <li>Whether you use AI to screen candidates, yes or no.</li>
            <li>No &quot;Canadian experience&quot; requirement. Ask for the skills and qualifications the job needs.</li>
          </ul>
          <p>
            The <Link href="/posting-policy">posting policy</Link> has the full list, and <Link href="/resources/ontario-job-ads">Ontario job ad rules for eye care clinics</Link> explains who the Ontario rules apply to. The pay table above is a good place to start when you set a range.
          </p>

          <h2 id="directory">Eye care suppliers and organisations in Canada</h2>
          <p>
            A reference list of frame houses, lens makers, labs, distributors, software vendors, buying groups, insurers and associations that work with Canadian eye care. Pick a category or search by name.
            Each entry was checked against public pages on {DIRECTORY_CHECKED}, and the descriptions are ours.
          </p>
          <DirectoryTable entries={DIRECTORY} categories={DIRECTORY_CATEGORIES} />
          <p className="help">
            Kestrel is not affiliated with any company or organisation listed, and a listing is not an endorsement. Entries are in no order of preference. If something is wrong or out of date,
            or you would like an entry added or removed, email <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a>.
          </p>

          <h2>Associations and regulators</h2>
          <p>
            Kestrel is not affiliated with any organisation listed here, and a link is not an endorsement.
          </p>
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`res-${g.id}`}>
              <h3 id={`res-${g.id}`}>{g.heading}</h3>
              <p>{g.intro}</p>
              <ul className="linklist">
                {g.links.map((l) => (
                  <li key={l.url}>
                    <a href={l.url}>{l.name}</a>
                    <span>{l.note}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {findYourFitOn() && (
            <>
              <h2>Not sure which role suits you?</h2>
              <p>
                The <Link href="/find-your-fit">Find your fit</Link> quiz asks a few questions about how you like to work and suggests roles to look at.
              </p>
            </>
          )}

          <h2>Looking for work, or hiring?</h2>
          <p>
            <Link href="/jobs">Browse eye care jobs</Link> across Canada, or see how Kestrel works <Link href="/clinics">for clinics</Link>.
          </p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
