import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import DraftNotice from "@/components/DraftNotice";
import SiteHeader from "@/components/SiteHeader";
import { shareMetadata } from "@/lib/share";

// Saved once and shown to everyone, then built again at most every 5 minutes (audit P1-10). force-static means that even if something on
// the page tried to read who is visiting, it would see nobody, so a saved page can never hold anything about a person. The rebuild brings
// in scheduled blog posts on their date, and the launch switch, which the header checks every 5 minutes (lib/launch.ts).
export const revalidate = 300;
export const dynamic = "force-static";

export const metadata: Metadata = shareMetadata({
  title: "Ontario job ad rules for eye care clinics",
  description: "Who Ontario's job posting rules apply to, what a covered ad must include, and what clinics must do after. Written for optometry and optical practices.",
  path: "/resources/ontario-job-ads",
});

const UPDATED = "8th November 2026";
// Steve checked this page against the Ontario government's guide and asked for the draft banner to come off on 9th November 2026.
// It is still on the list for the lawyer to read. Set back to true if the rules change and the page needs rechecking.
const DRAFT = false;
const GUIDE = "https://www.ontario.ca/document/your-guide-employment-standards-act-0/requirements-related-publicly-advertised-job";
const REGULATION = "https://www.ontario.ca/laws/regulation/240476";

export default function OntarioJobAds() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="legal">
        <div className="wrap legal-wrap">
          <h1>Ontario job ad rules for eye care clinics</h1>
          <p className="updated">Last updated {UPDATED}</p>
          {DRAFT && <DraftNotice />}

          <p>
            Since 1st January 2026, Ontario employers with 25 or more employees have to follow rules for publicly advertised jobs. The rules are part of the Employment Standards Act, 2000.
            This page explains them for optometry and optical practices, and where Kestrel fits. It is general information, not legal advice.
          </p>

          <h2>Do the rules apply to your clinic?</h2>
          <p>
            They apply to an employer with 25 or more employees on the day the job is posted. An employer with fewer than 25 is not covered. The count is for the employer as a whole, across all its locations.
            A corporate group, or an owner with several clinics, counts every employee together and not only the people at the clinic where the new hire would work. If you are not sure who the employer is, ask a lawyer.
          </p>
          <p>
            Some postings sit outside the rules even for a covered employer: a job open only to people who already work for you, a general sign or campaign that does not advertise a specific job,
            and a job where the work is done outside Ontario. The government guide below has the full list.
          </p>

          <h2>What a covered job ad must include</h2>
          <ul>
            <li>The pay: the expected pay, or a range. A range can be no more than $50,000 wide. No pay is needed if the expected pay, or the top of the range, is over $200,000 a year.</li>
            <li>Whether the job is for an existing vacancy, yes or no. A posting that builds a pool of people for later is allowed, as long as it says so.</li>
            <li>Whether you use artificial intelligence to screen, assess or select applicants. If your practice software or an email tool sorts applications, find out how it works before you answer.</li>
            <li>No requirement for Canadian experience, in the ad or on the application form. Registration with the provincial regulator is different: you can ask for the registration the job needs.</li>
          </ul>
          <p>
            An optician ad might say $30 to $36 an hour, and an associate optometrist ad might give a yearly range no wider than $50,000. Those are examples of the format, not advice on what to pay.
            For typical pay by province, see the <Link href="/resources#pay">pay table</Link>. Kestrel&apos;s form turns an hourly range into a yearly figure over 2,080 hours to apply the $50,000 limit.
          </p>

          <h2>After the ad</h2>
          <p>
            Two more duties apply to a covered employer. If you interview someone for a publicly advertised job, you must tell them whether a hiring decision has been made within 45 days of their last interview.
            And you must keep a copy of the posting, and any application form, for 3 years after the posting comes down. Keep your own copy as well as whatever is in your Kestrel dashboard.
          </p>

          <h2>What Kestrel does</h2>
          <p>
            Every Kestrel post needs a pay range, a yes or no for existing vacancy, a yes or no for AI screening, and it refuses Canadian experience requirements, wherever the clinic is.
            So a covered clinic&apos;s post carries the details the ad rules ask for. Kestrel cannot tell you whether the rules apply to your clinic, and posting on Kestrel does not meet the 45 day or record keeping duties.
            Those stay with the employer.
          </p>

          <h2>Other provinces</h2>
          <p>
            British Columbia has its own pay range rule for postings, and other provinces differ. Because Kestrel asks every clinic for the same details, one form works everywhere.
            The <Link href="/resources#hiring-rules">hiring rules on the Resources page</Link> list what Kestrel asks, and the <Link href="/posting-policy">posting policy</Link> has the full list.
          </p>

          <h2>Official sources</h2>
          <p>
            Rules change, so check the current version before you rely on this page.
          </p>
          <ul>
            <li><a href={GUIDE} rel="noopener noreferrer">Ontario government: your guide to the Employment Standards Act, requirements for publicly advertised job postings</a></li>
            <li><a href={REGULATION} rel="noopener noreferrer">Ontario Regulation 476/24, the rules and exemptions for job postings</a></li>
          </ul>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
