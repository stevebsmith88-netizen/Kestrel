import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy | Kestrel Eye Care Jobs",
  description: "How Kestrel Eye Care Jobs collects, uses and protects your personal information.",
};

const UPDATED = "29th October 2026";
const EMAIL = "privacy@eyecarejobs.ca";

export default function Privacy() {
  return (
    <>
      <main className="legal">
        <div className="wrap legal-wrap">
          <Link href="/" className="legal-logo" aria-label="Kestrel Eye Care Jobs, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={220} height={65} />
          </Link>

          <h1>Privacy policy</h1>
          <p className="updated">Last updated {UPDATED}</p>

          <p>
            Kestrel Eye Care Jobs (&quot;Kestrel&quot;, &quot;we&quot; or &quot;us&quot;) is building a job board for eye care across Canada.
            This policy explains what personal information we collect when you join our waitlist or use this website, why we
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
            <li>Supabase, which hosts our database in Canada.</li>
            <li>Vercel, which hosts our website.</li>
            <li>An email delivery provider, once we begin sending email. We will name it here when we do.</li>
          </ul>
          <p>We may also disclose information when the law requires it.</p>

          <h2>Where your information is kept</h2>
          <p>
            Your waitlist details are stored in a database hosted in Canada. Our website hosting provider is based in the United
            States and may handle requests, including your sign up, on servers outside Canada. While your information is there,
            it may be subject to the laws of that country.
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep your waitlist details while you are on the list. If you ask us to delete your details, we will, apart from a
            minimal record that we received and carried out your request, and the suppression record described above.
          </p>

          <h2>How we protect it</h2>
          <p>
            We limit who can see waitlist details, store them in a database with restricted access, use encrypted connections
            (HTTPS), and keep our access keys out of the website&apos;s public code. No system is perfectly secure. If a breach
            creates a real risk of significant harm to you, we will tell you and the Office of the Privacy Commissioner of
            Canada.
          </p>

          <h2>Your rights</h2>
          <p>
            You can ask to see the personal information we hold about you, ask us to correct it, ask us to delete it, or
            withdraw your consent. Email <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. We may need to confirm who you are first. If
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
