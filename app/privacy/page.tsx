import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: "Privacy policy",
  description: "How Kestrel Eye Care Jobs collects, uses and protects your personal information.",
  path: "/privacy",
});

const UPDATED = "12th November 2026";
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
            Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
          <p>Our privacy officer looks after questions about this policy and about your personal information.</p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>What you give us on the waitlist form:</strong> your first name, your last name (optional), your email address,
              whether you are a clinic or looking for a role, your clinic name (clinics only), your role, and your province or
              territory. We then email you a link to confirm that the address is yours, and we keep the date you confirmed it.
            </li>
            <li>
              <strong>If you create an account:</strong> your name, your email address and whether you are a candidate or a clinic.
            </li>
            <li>
              <strong>If you sign in with Google:</strong> Google tells us your name and email address. We never see your Google password.
            </li>
            <li>
              <strong>If you are a candidate:</strong> the details you add to your profile (your role, where you are licensed,
              your experience, when you are available, and a phone number if you choose to give one), the resume you upload, and the
              cover letters and applications you send. If you choose <strong>Fill in from my resume</strong>, our own server reads
              the text of your resume once to suggest answers for your profile. It does this with fixed rules, not AI, it does not
              keep the text, and it does not send it to any other service. Nothing from it is saved unless you tick it and save.
            </li>
            <li>
              <strong>Also for candidates, private to you:</strong> your home town and province, how far you would travel, the provinces and
              types of work you would consider, other roles you would consider, the lowest pay you would accept and whether that is by the hour or the year, whether you
              prefer an independent or a corporate practice, the practice software you know, your answer to &quot;where are you in eye care&quot; if you give one,
              and the jobs you mark &quot;Not interested&quot;. We use these only to build your <strong>Recommended for you</strong> list.
              Clinics never see your preferences, your lowest pay, your career stage answer or your town. A clinic sees only what is
              listed on the apply page when you send an application. You can change your preferences in your profile, you can ask us to remove anything else by email, and all of it is in the copy of your information you can download.
            </li>
            <li>
              <strong>Your inbox:</strong> the messages Kestrel sends to you inside your account, such as an update on an application,
              and whether you have read them. <strong>Your name:</strong> we keep the date you last changed your name, because a change starts a 30 day hold before the next one.
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
            We do not currently use advertising cookies or tracking tools on this site. We do count how many times each job
            page is viewed and how many times Apply is pressed, so clinics can see how their posts are doing. These counts
            are kept for each job and each day, without cookies, and do not record who you are. If you join the waitlist, we also
            save how your visit began: the website that sent you, the page you landed on and any campaign tag in the link you
            clicked. This helps us learn which of our pages and links are useful. It is held in your browser only until you close
            the tab, and is sent to us only if you press the join button. If our approach changes, we
            will update this policy and ask for your consent where the law requires it.
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
            <strong>News and offers.</strong> We send launch news, product updates and offers only if you ticked the consent box. You can withdraw your consent at any time by emailing{" "}
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a> or replying to any email from us. We will act on your request within 10
            business days. Every marketing email we send will include an unsubscribe link.
          </p>
          <p>
            <strong>Emails about your account or an application.</strong> These are sent whether or not you ticked the consent box, because you need them to use Kestrel.
            They include the link to confirm your email address, a password reset, an update on an application you sent, and a new applicant for a clinic. The job alerts you set up yourself keep coming until you delete the alert or unsubscribe.
            Kestrel also has a short series of welcome emails for new accounts. It is switched off today, and nobody is sent it.
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
            <li>Supabase, which hosts our database and stored resumes in Canada.</li>
            <li>Vercel, which hosts our website.</li>
            <li>Resend, which sends our emails, such as sign up confirmations and application updates.</li>
            <li>Google, if you choose to sign in with it. Google is told when you sign in to Kestrel, and handles your sign in under its own privacy policy.</li>
            <li>Cloudflare, whose Turnstile security check on our forms tells real people from robots. It looks at signals from your browser, such as how it behaves, and does not need you to solve a puzzle in most cases.</li>
            <li>Anthropic, whose AI helps clinics write job ads. It sees only the job details a clinic types in, never candidate information.</li>
          </ul>
          <p>
            <strong>Clinics.</strong> When you apply to a job, the clinic that posted it can see your application: your cover letter,
            your resume and the details you chose to give, as they were when you applied. It cannot see your profile otherwise, and
            clinics never see applications that were sent to other clinics.
          </p>
          <p>
            <strong>Candidates.</strong> Clinic email addresses are never shown on job posts. Candidates apply to a clinic through Kestrel.
          </p>
          <p>We may also disclose information when the law requires it.</p>

          <h2>If you unsubscribe</h2>
          <p>
            We keep your email address, and nothing else about the email, on a do not email list, so that we honour your request in future. Even if you or your clinic
            post another job or join again by mistake, we will not send you marketing email. We will still send emails about an account or application you have, such
            as a new applicant or a password reset.
          </p>

          <h2>Where your information is kept</h2>
          <p>
            Your details, resume and applications are stored in a database and a private file store hosted in Canada. Our website
            hosting provider, our email provider, our AI provider and our security check provider are based in the United States and may handle requests, and the emails we
            send you, on servers outside Canada. While your information is there, it may be subject to the laws of that country.
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep your waitlist details while you are on the list, and your account, profile and resume while your account is open.
            You can replace or delete your resume in your profile at any time. If you ask us to delete your account, we will delete
            your profile, your resume and your applications, apart from a minimal record that we received and carried out your
            request, and the suppression record described above. A clinic that has already received your application may have
            kept its own copy of what you sent it, and you can ask us to ask that clinic to remove it.
          </p>

          <h2>How we protect it</h2>
          <p>
            We limit who can see your details, store them in a database with restricted access, keep resumes in a private store that
            can only be opened through a link that works for 1 minute, use encrypted connections (HTTPS), and keep our access
            keys out of the website&apos;s public code. No system is perfectly secure. The page <Link href="/security">How we protect your data</Link> says more. If a breach
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
      <AppFooter />
    </>
  );
}
