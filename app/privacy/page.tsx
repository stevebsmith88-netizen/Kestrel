import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy policy | Kestrel Eye Care Jobs",
  description: "How Kestrel Eye Care Jobs collects, uses and protects your personal information.",
};

const UPDATED = "30th October 2026";
const EMAIL = "privacy@eyecarejobs.ca";

export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="legal">
        <div className="wrap legal-wrap">
          <h1>Privacy policy</h1>
          <p className="updated">Last updated {UPDATED}</p>

          <p>
            Kestrel Eye Care Jobs (&quot;Kestrel&quot;, &quot;we&quot; or &quot;us&quot;) is building a job board for eye care across Canada.
            This policy explains what personal information we collect when you join our waitlist, create an account or use this website, why we
            collect it, and the choices you have. We follow Canada&apos;s Personal Information Protection and Electronic
            Documents Act (PIPEDA) and Canada&apos;s anti-spam law (CASL).
          </p>

          <h2>Who we are and how to reach us</h2>
          <p>
            Kestrel Eye Care Jobs<br />
            6013 Yonge Street, 3rd Floor<br />
            North York, Ontario M2M 3W2, Canada<br />
            Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
          <p>Our privacy officer looks after questions about this policy and about your personal information.</p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>What you give us on the waitlist form:</strong> your first name, your last name (optional), your email address,
              whether you are a clinic or looking for a role, your clinic name (clinics only), your role, and your province or
              territory.
            </li>
            <li>
              <strong>If you create an account:</strong> your name, your email address and whether you are a candidate or a clinic.
            </li>
            <li>
              <strong>If you are a candidate:</strong> the details you add to your profile (your role, where you are licensed,
              your experience, when you are available, and a phone number if you choose to give one), the CV you upload, and the
              cover letters and applications you send.
            </li>
            <li>
              <strong>If you are a clinic:</strong> your clinic&apos;s name, location, website and description, the job posts you
              write, and the private email address where you want to receive alerts.
            </li>
            <li>
              <strong>Job alerts:</strong> the roles, provinces and type of practice you choose, and how often you want an email.
            </li>
            <li>
              <strong>If you report a job:</strong> what you tell us about it and, only if you choose to give it, your email address so we can write back.
            </li>
            <li>
              <strong>A record of your consent:</strong> the exact wording you agreed to, and the date and time you agreed.
            </li>
            <li>
              <strong>Basic technical information:</strong> when you visit, our hosting provider records standard details such as
              your IP address, browser and the time of your visit. This is used for security and to keep the site running.
            </li>
          </ul>
          <p>
            We do not currently use advertising cookies or tracking tools on this site. If that changes, we will update this
            policy and ask for your consent where the law requires it.
          </p>

          <h2>Why we collect it</h2>
          <ul>
            <li>
              To add you to our waitlist and email you about Kestrel Eye Care Jobs, including launch news, job alerts, product
              updates and offers.
            </li>
            <li>To run your account, let candidates apply to jobs, and let clinics review the applications they receive.</li>
            <li>To keep a record of your consent, as Canadian law requires.</li>
            <li>To keep the website secure and working.</li>
          </ul>
          <p>We will not use your details for a different purpose without asking you first.</p>

          <h2>Your consent and unsubscribing</h2>
          <p>
            We only email you if you ticked the consent box. You can withdraw your consent at any time by emailing{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or replying to any email from us. We will act on your request within 10
            business days. Every marketing email we send will include an unsubscribe link.
          </p>
          <p>
            If you unsubscribe, we keep your email address and the date on a suppression list so that we do not email you again
            by mistake.
          </p>

          <h2>Who we share it with</h2>
          <p>
            We do not sell your personal information. We use a small number of service providers to run Kestrel. They handle
            your information only to provide their service to us:
          </p>
          <ul>
            <li>Supabase, which hosts our database and stored CVs in Canada.</li>
            <li>Vercel, which hosts our website.</li>
            <li>Resend, which sends our emails, such as sign up confirmations and application updates.</li>
            <li>Anthropic, whose AI helps clinics write job ads. It sees only the job details a clinic types in, never candidate information.</li>
          </ul>
          <p>
            <strong>Clinics.</strong> When you apply to a job, the clinic that posted it can see your application: your cover letter,
            your CV and the details you chose to give, as they were when you applied. It cannot see your profile otherwise, and
            clinics never see applications that were sent to other clinics.
          </p>
          <p>
            <strong>Candidates.</strong> Clinic email addresses are never shown on job posts. Candidates apply to a clinic through Kestrel.
          </p>
          <p>We may also disclose information when the law requires it.</p>

          <h2>Where your information is kept</h2>
          <p>
            Your details, CV and applications are stored in a database and a private file store hosted in Canada. Our website
            hosting provider, our email provider and our AI provider are based in the United States and may handle requests, and the emails we
            send you, on servers outside Canada. While your information is there, it may be subject to the laws of that country.
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep your waitlist details while you are on the list, and your account, profile and CV while your account is open.
            You can replace or delete your CV in your profile at any time. If you ask us to delete your account, we will delete
            your profile, your CV and your applications, apart from a minimal record that we received and carried out your
            request, and the suppression record described above. A clinic that has already received your application may have
            kept its own copy of what you sent it, and you can ask us to ask that clinic to remove it.
          </p>

          <h2>How we protect it</h2>
          <p>
            We limit who can see your details, store them in a database with restricted access, keep CVs in a private store that
            can only be opened through a link that works for one minute, use encrypted connections (HTTPS), and keep our access
            keys out of the website&apos;s public code. No system is perfectly secure. If a breach
            creates a real risk of significant harm to you, we will tell you and the Office of the Privacy Commissioner of
            Canada.
          </p>

          <h2>Your rights</h2>
          <p>
            You can ask to see the personal information we hold about you, ask us to correct it, ask us to delete it, or
            withdraw your consent. You can download a copy of your information and delete your account yourself on the Account page, or email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. We may need to confirm who you are first. If
            you are not satisfied with our response, you can contact the{" "}
            <a href="https://www.priv.gc.ca" rel="noopener noreferrer">Office of the Privacy Commissioner of Canada</a>.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We will update this page as Kestrel grows, for example when we launch accounts, job posting and payments. The date at
            the top shows the latest version. If a change affects how we use your information in a way you have not agreed to,
            we will ask for your consent first.
          </p>
        </div>
      </main>
      <footer>
        <div className="wrap">
          <span>
            <strong>Kestrel Eye Care Jobs</strong> &middot; eyecarejobs.ca
          </span>
          <span>
            <Link href="/">Home</Link> &middot; &copy; {new Date().getFullYear()} Kestrel Eye Care Jobs
          </span>
        </div>
      </footer>
    </>
  );
}
