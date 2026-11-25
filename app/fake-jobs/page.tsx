import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { shareMetadata } from "@/lib/share";

// Kestrel's written policy on fraudulent job posts. Since 1st January 2026 Ontario's Employment Standards Act requires every job board to
// have a way to report a fraudulent post, shown where users will see it (the "Report this job" link on every job page), and a written policy
// on how reports are dealt with, posted and kept posted where users will see it (this page, linked from every job page, the footer, the
// report page and the help centre). Each version must be kept for 3 years after it is replaced: every version of this file is kept in the
// repository's history, and docs/legal/fake-jobs-policy-versions.md lists them with their dates. Wording and the 2 business day promise
// agreed by Steve on 13th November 2026.
// Saved once and shown to everyone, then built again at most every 5 minutes, like the other policy pages (audit P1-10).
export const revalidate = 300;
export const dynamic = "force-static";

export const metadata: Metadata = shareMetadata({
  title: "Reporting fake jobs",
  description: "How to report a fake or fraudulent job on Kestrel, and what we do when you do.",
  path: "/fake-jobs",
});

const UPDATED = "13th November 2026";

export default async function FakeJobs() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="legal">
        <div className="wrap legal-wrap">
          <h1>Reporting fake or fraudulent jobs</h1>
          <p className="updated">Last updated {UPDATED}</p>

          <p>
            A person at Kestrel reads every job before it goes live. Even so, if a job looks wrong to you, please tell us. You do not need an account.
          </p>

          <h2>What we treat as fake or fraudulent</h2>
          <ul>
            <li>A job that does not exist.</li>
            <li>A post that asks you for money, a deposit, banking details or your social insurance number before a job offer.</li>
            <li>Someone posing as a clinic, or using a clinic&apos;s name without its permission.</li>
            <li>Pay, a place or work that is not what is really on offer.</li>
            <li>A recruiter or agency posing as the employer.</li>
          </ul>

          <h2>How to report a job</h2>
          <p>
            Press <strong>Report this job</strong> on the job&apos;s page, or email <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a> with
            the job&apos;s web address and what is wrong. Giving your email address is optional. If you do, we can tell you what we did.
          </p>

          <h2>What we do</h2>
          <p>
            We look at every report within 2 business days. While we check, we may hide the job. If it is fake or breaks
            our <Link href="/posting-policy">posting policy</Link>, we take it down, tell the clinic why, and may suspend the account. If you gave your
            email address, we tell you the outcome.
          </p>
          <p>
            If you have lost money or personal information, please also report it to the Canadian Anti-Fraud Centre and your local police.
          </p>

          <h2>Protect yourself</h2>
          <p>
            A real clinic never asks you to pay to apply, and never needs your banking details or your social insurance number before it has made you
            an offer. Applying through Kestrel keeps your contact details private until you choose to send an application.
          </p>

          <h2>Our records</h2>
          <p>We keep each report, and what we did about it, for 2 years. We keep every version of this policy for 3 years after it is replaced.</p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
