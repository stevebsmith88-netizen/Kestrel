import type { Metadata } from "next";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: "Contact",
  description: "Contact the Kestrel Eye Care Jobs team with a question about a job post, your account or the site.",
  path: "/contact",
});

export default async function Contact() {
  return (
    <>
      <SiteHeader session={await getSession()} />
      <main id="main" tabIndex={-1} className="legal">
        <div className="wrap legal-wrap">
          <h1>Contact us</h1>
          <p>A person on the Kestrel team reads every message. We aim to reply within 2 business days.</p>

          <h2>General questions and help</h2>
          <p><a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a></p>

          <h2>Privacy requests</h2>
          <p>To see, correct or remove your information, or to ask about our privacy practices: <a href="mailto:privacy@eyecarejobs.ca">privacy@eyecarejobs.ca</a></p>

          <h2>Report a job</h2>
          <p>Use the &quot;Report this job&quot; link on the job&apos;s page. If you cannot, email us the job&apos;s web address and what is wrong.</p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
