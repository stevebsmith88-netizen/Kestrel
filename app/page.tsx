import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HomeBelowHero from "@/components/HomeBelowHero";
import LaunchHome from "@/components/LaunchHome";
import PreLaunchHome from "@/components/PreLaunchHome";
import { homeModeNow } from "@/lib/launch";
import SiteHeader from "@/components/SiteHeader";
import { shareMetadata } from "@/lib/share";

// Built ahead of time, and rebuilt at least hourly, so a scheduled post appears on the home page soon after its date.
export const revalidate = 3600;

// Before launch the page keeps the site's default "Coming soon" title. After launch (lib/launch.ts) it gets its own.
export async function generateMetadata(): Promise<Metadata> {
  if ((await homeModeNow()) !== "launch") return {};
  return shareMetadata({ title: "Eye care jobs across Canada", description: "A Canada-wide eye care job board. Independent and corporate practices post side by side, and every job shows its pay.", path: "/" });
}

// At launch the sign up gate opens (docs/launch-checklist.md) and the launch layout takes over from the coming soon page by itself.
export default async function Home() {
  const mode = await homeModeNow();
  if (mode === "launch") return <LaunchHome />;
  return mode === "prelaunch" ? <PreLaunchHome /> : <ComingSoon />;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

// Tells search engines and AI assistants who we are. The same name, line and logo are used everywhere. Social page
// links (sameAs) are added as those pages are created.
const ORGANIZATION = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE}/#organization`,
      name: "Kestrel Eye Care Jobs",
      url: SITE,
      logo: `${SITE}/brand/kestrel-lockup-full.png`,
      description: "A Canada-wide job board for eye care: optometrists, opticians, assistants, clinic teams and suppliers. Every job shows its pay.",
      areaServed: { "@type": "Country", name: "Canada" },
      sameAs: ["https://www.linkedin.com/company/kestrel-eye-care-jobs/"],
    },
    { "@type": "WebSite", "@id": `${SITE}/#website`, name: "Kestrel Eye Care Jobs", url: SITE, inLanguage: "en-CA", publisher: { "@id": `${SITE}/#organization` } },
  ],
};

function ComingSoon() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION).replace(/</g, "\\u003c") }} />
      <SiteHeader logo={false} />
      <main id="main" tabIndex={-1}>
        <section className="hero">
          <div className="wrap">
            <span className="pill">Waitlist now open</span>
            <h1 className="sr">Kestrel Eye Care Jobs: eye care jobs across Canada</h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mark" src="/logo.svg" alt="Kestrel" width={1300} height={340} />
            <p className="tag" aria-hidden="true">Eye care jobs</p>
            <svg className="leaf" viewBox="0 0 100 100" aria-hidden="true">
              <path fill="#A4502C" d="M50 2L57 16L64 12L61 36L75 22L79 30L93 27L89 41L97 46L77 62L81 71L57 67L56 86L52 86L52 100L48 100L48 86L44 86L43 67L19 71L23 62L3 46L11 41L7 27L21 30L25 22L39 36L36 12L43 16Z" />
            </svg>
            <p className="board">Canada-wide eye care job board</p>
            <p className="lede">
              A job board for eye care in Canada, built by someone with over 20 years in the industry. Optometrists, opticians, assistants, clinic teams and suppliers, in one place. Every job shows its pay, and a person reads every post before it goes live. We&apos;re launching soon.
            </p>
            <a className="btn" href="#join">Join the waitlist</a>
          </div>
          <div className="skyline" aria-hidden="true">
            <Image src="/skyline.png" alt="" width={2000} height={462} priority sizes="100vw" />
          </div>
        </section>

        <HomeBelowHero />
      </main>
      <footer>
        <div className="wrap">
          <span>
            <strong>Kestrel Eye Care Jobs</strong> &middot; eyecarejobs.ca
          </span>
          <span>
            <Link href="/eye-care-jobs">Jobs by province</Link> &middot; <Link href="/blog">Blog</Link> &middot; <Link href="/resources">Resources</Link> &middot; <Link href="/compare">Compare prices</Link> &middot; <Link href="/privacy">Privacy</Link> &middot; <Link href="/security">Security</Link> &middot; <Link href="/terms">Terms</Link> &middot; <Link href="/posting-policy">Posting policy</Link> &middot; <Link href="/contact">Contact</Link> &middot; &copy; {new Date().getFullYear()} Kestrel Eye Care Jobs
          </span>
        </div>
      </footer>
    </>
  );
}
