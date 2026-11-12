import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import DraftNotice from "@/components/DraftNotice";
import SiteHeader from "@/components/SiteHeader";
import { shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: "How we protect your data",
  description: "Where Kestrel keeps your information, who can see it, and how resumes and sign in are protected.",
  path: "/security",
});

const UPDATED = "7th November 2026";
// Set to false once a lawyer has read the page, as on the Terms page.
const DRAFT = true;
const EMAIL = "privacy@eyecarejobs.ca";

export default function Security() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="legal">
        <div className="wrap legal-wrap">
          <h1>How we protect your data</h1>
          <p className="updated">Last updated {UPDATED}</p>
          {DRAFT && <DraftNotice />}

          <p>
            Kestrel holds names, contact details, resumes and cover letters, so protecting them is part of the job. This page says what we do today, in plain terms.
            It does not promise more than we do. For what we collect and why, read the <Link href="/privacy">privacy policy</Link>.
          </p>

          <h2>Where your information is kept</h2>
          <p>
            Your details, resume and applications are stored in a database and a private file store hosted in Canada. Our website host, email provider, bot check and AI
            provider are based in the United States, and the privacy policy lists each one and what it handles.
          </p>

          <h2>Who can see what</h2>
          <p>
            A candidate&apos;s profile is private. A clinic sees an application only when the candidate sends it, only for that clinic&apos;s own job, and as it was on the day it was sent.
            Clinics never see applications sent to other clinics, and a clinic&apos;s email address is never shown on a job post.
          </p>
          <p>
            These rules are enforced by the database itself, on every table, and not only by the website. If a page had a mistake in it, the database would still refuse to hand over
            someone else&apos;s information.
          </p>

          <h2>Resumes</h2>
          <p>
            Resumes are kept in a private store. Nobody can open one by guessing a web address: a clinic or a candidate opens it through a link that works for 1 minute.
            Files that contain macros, scripts or embedded files are refused when they are uploaded.
          </p>
          <p>
            If a candidate chooses Fill in from my resume, Kestrel&apos;s own server reads the text of that one file to suggest profile answers. It uses fixed rules and no AI, the text is not saved, and it is not sent to any other service. Only PDF and Word (.docx) files are read, with a limit on size for both, and on pages and time for a PDF.
          </p>

          <h2>Signing in</h2>
          <p>
            Passwords are never stored in a readable form, even by us. You can sign in with Google instead. Repeated wrong attempts are slowed down, and the sign up and waitlist forms
            use a bot check so that automated programs cannot flood them. All connections to Kestrel are encrypted (HTTPS).
          </p>

          <h2>Keys and access</h2>
          <p>
            The keys that let the website reach its database, send email and use the ad builder are kept out of the website&apos;s public code. We keep a written plan for
            changing each one within minutes, and for what to do if a service we depend on is breached.
          </p>

          <h2>Payments and AI</h2>
          <p>
            When payments start, card details will go to Stripe and Kestrel will not store card numbers. The ad builder, which uses Anthropic, sees what a clinic types in, up to 8 of that clinic&apos;s earlier ads and text from the clinic&apos;s own public website. Our admin tools also send it public careers pages and web searches about clinics. It never receives anything about candidates.
            Kestrel does not use AI to rank applicants for clinics.
          </p>

          <h2>If something goes wrong</h2>
          <p>
            We have a written breach plan. If a breach creates a real risk of significant harm to you, we will tell you and the Office of the Privacy Commissioner of Canada.
          </p>

          <h2>What we do not have</h2>
          <p>
            We do not hold a formal security certification such as SOC 2, and we have not yet had an independent security review. If that changes, this page will say so.
          </p>

          <h2>Found a problem?</h2>
          <p>
            If you think you have found a weakness, or you are worried about your own information, write to <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Please do not publish a problem before we have had a chance to fix it.
          </p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
