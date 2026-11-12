import type { Metadata } from "next";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { shareMetadata } from "@/lib/share";

// Saved once and shown to everyone, then built again at most every 5 minutes (audit P1-10). force-static means that even if something on
// the page tried to read who is visiting, it would see nobody, so a saved page can never hold anything about a person. The rebuild brings
// in scheduled blog posts on their date, and the launch switch, which the header checks every 5 minutes (lib/launch.ts).
export const revalidate = 300;
export const dynamic = "force-static";

export const metadata: Metadata = shareMetadata({
  title: "Contact",
  description: "Contact the Kestrel Eye Care Jobs team with a question about a job post, your account or the site.",
  path: "/contact",
});

export default async function Contact() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="legal">
        <div className="wrap legal-wrap">
          <h1>Contact us</h1>
          <p>A person on the Kestrel team reads every message. We aim to reply promptly, within 1 to 3 business days.</p>

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
