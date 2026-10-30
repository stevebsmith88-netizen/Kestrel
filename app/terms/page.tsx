import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import DraftNotice from "@/components/DraftNotice";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Terms of use | Kestrel Eye Care Jobs",
  description: "The rules for using Kestrel Eye Care Jobs, for candidates and for clinics.",
};

const UPDATED = "30th October 2026";
const DRAFT = true;

export default async function Terms() {
  return (
    <>
      <SiteHeader session={await getSession()} />
      <main id="main" tabIndex={-1} className="legal">
        <div className="wrap legal-wrap">
          <h1>Terms of use</h1>
          <p className="updated">Last updated {UPDATED}</p>
          {DRAFT && <DraftNotice />}

          <p>
            These terms are an agreement between you and Kestrel Eye Care Jobs (&quot;Kestrel&quot;, &quot;we&quot; or &quot;us&quot;). They apply when you use
            eyecarejobs.ca, whether you are looking for a job or hiring. By creating an account or using the site, you agree to them. If you
            do not agree, please do not use Kestrel. Our <Link href="/privacy">privacy policy</Link> and <Link href="/posting-policy">posting policy</Link> are part of these terms.
          </p>

          <h2>What Kestrel is</h2>
          <p>
            Kestrel is a job board for eye care in Canada. We help clinics share jobs and help candidates find and apply for them. We are not an
            employer, a recruiter or an employment agency. We do not choose who a clinic hires, and we cannot promise that anyone will be hired or
            that any job will lead to an interview.
          </p>

          <h2>Your account</h2>
          <ul>
            <li>You must be at least 16 years old to create an account.</li>
            <li>Give accurate information and keep it up to date. Do not create an account for someone else, or more than one account for yourself.</li>
            <li>Keep your password private. You are responsible for what happens under your account. Tell us at once if you think someone else has used it.</li>
          </ul>

          <h2>If you are a candidate</h2>
          <ul>
            <li>When you apply, the clinic that posted the job can see your application, including your cover letter, your CV and the details you chose to give. Only apply to jobs you are interested in.</li>
            <li>Make sure what you tell clinics is true, including your qualifications and registration.</li>
            <li>Clinic contact details are not shown on job posts. Please use Kestrel to apply, and do not try to collect clinic or staff contact details from the site.</li>
            <li>We may email you about your applications and, if you have agreed, about jobs and Kestrel news. You can unsubscribe at any time.</li>
          </ul>

          <h2>If you are a clinic</h2>
          <ul>
            <li>You must be hiring directly for your own practice. Recruiters, staffing agencies and job brokers may not use Kestrel to post jobs or to contact candidates.</li>
            <li>Every job you post must follow our <Link href="/posting-policy">posting policy</Link>. We read each post before it goes live, and we may ask you to change it, decline it, or remove it later.</li>
            <li>You are responsible for your hiring decisions and for following the laws that apply to you as an employer, including human rights, employment standards, pay transparency and privacy laws. Kestrel does not give legal advice.</li>
            <li>Use applicants&apos; information only to assess them for the job they applied for, unless they agree to something more, such as being kept in mind for future roles.</li>
          </ul>

          <h2>What you may not do</h2>
          <ul>
            <li>Post or send anything false, misleading, discriminatory, unlawful or abusive.</li>
            <li>Use Kestrel as a recruiter, agency or broker, or to sell services to clinics or candidates without our written agreement.</li>
            <li>Ask a candidate for money to be considered for a job.</li>
            <li>Copy, scrape or collect jobs, candidate details or contact information from the site by automated means, or resell them.</li>
            <li>Send spam, or use Kestrel to contact people who have not applied to you for anything other than the job they applied for.</li>
            <li>Interfere with the site, try to get around its security, or use it in a way that harms others.</li>
          </ul>

          <h2>Fees and payment</h2>
          <p>
            While Kestrel is in its free launch period, posting is free and these fee terms do not yet apply. When fees begin, we will say so on the site
            and by email before you are charged anything.
          </p>
          <ul>
            <li>Prices are shown in Canadian dollars before HST or other taxes. Tax is added at checkout and shown on your receipt.</li>
            <li>Payments are handled by Stripe, a payment company. We do not see or store your full card number.</li>
            <li>A single job post lasts 30 days from the day it goes live. A monthly clinic pass renews each month until you cancel, and you can cancel at any time. Cancelling stops the next renewal, and your pass stays active until the end of the period you have paid for.</li>
            <li>Once a post has gone live, its fee is not refundable. If we decline a post before it goes live, or a fault on our side stops it from being published, we will refund the fee or let you repost for free. If you think you were charged in error, write to us within 30 days.</li>
            <li>If we remove a post because it breaks these terms or our posting policy, we do not refund its fee.</li>
            <li>We may change our prices. A change applies to your next purchase or renewal, and we will give you notice first.</li>
            <li>Coupons and promotional codes have no cash value and may be withdrawn or have conditions, which we will state with the offer.</li>
          </ul>

          <h2>Content you provide</h2>
          <p>
            You keep ownership of what you give us, such as job ads, clinic descriptions, CVs and cover letters. You give Kestrel permission to store it, display
            it on the site, and share it as needed to run Kestrel, for example showing a job post to visitors or sending your application to the clinic you applied to.
            You promise you have the right to give us this content. We may remove content that breaks these terms.
          </p>

          <h2>Reporting problems</h2>
          <p>
            Anyone can report a job using the &quot;Report this job&quot; link on its page. We may take down a post while we look into a report. We may suspend or close an
            account that breaks these terms, and we will usually tell you why.
          </p>

          <h2>Our content and brand</h2>
          <p>
            The Kestrel name, logo, design and the text and software that run the site belong to us. You may not copy them or use them in a way that suggests
            we support you, without our written permission.
          </p>

          <h2>No guarantees, and limits on our responsibility</h2>
          <p>
            We work hard to keep Kestrel accurate and available, but we provide it &quot;as is&quot;. We do not promise that it will always be available, error free or that
            every job, clinic or candidate is as described. We are not responsible for what clinics and candidates say or do, or for other websites that a job post links
            to. To the extent the law allows, Kestrel is not liable for indirect or consequential losses, or for losses beyond the amount you paid us in the 12 months
            before the problem arose. Nothing in these terms limits any rights you have under the law that cannot be limited.
          </p>

          <h2>Ending your account</h2>
          <p>
            You can delete your account at any time from your account page. We may suspend or end access if these terms are broken, or if we must by law. Sections that
            by their nature should continue, such as those about payment and responsibility, continue after an account ends.
          </p>

          <h2>Changes to these terms</h2>
          <p>
            We may update these terms. If a change matters, we will tell you by email or on the site before it applies. Using Kestrel after a change means you accept it.
          </p>

          <h2>Law and contact</h2>
          <p>
            These terms are governed by the laws of Ontario and the federal laws of Canada that apply there. Disputes go to the courts of Ontario. Questions about these
            terms can go to <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a>. See our <Link href="/contact">contact page</Link> for our mailing address.
          </p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
