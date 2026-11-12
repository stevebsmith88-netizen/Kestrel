import type { Metadata } from "next";
import Image from "next/image";
import AppFooter from "@/components/AppFooter";
import HomeBelowHero from "@/components/HomeBelowHero";
import LaunchHome from "@/components/LaunchHome";
import PreLaunchHome from "@/components/PreLaunchHome";
import { homeModeNow } from "@/lib/launch";
import SiteHeader from "@/components/SiteHeader";
import { organizationJson } from "@/lib/organization-data";
import { shareMetadata } from "@/lib/share";

// The header looks up who is signed in, so this page is built for each visit. That also means a scheduled post appears on the
// home page as soon as its date arrives.

// Before launch the page keeps the site's default "Coming soon" title. After launch (lib/launch.ts) it gets its own.
export async function generateMetadata(): Promise<Metadata> {
  const mode = await homeModeNow();
  if (mode === "coming-soon") return {};
  // Its own title, description and canonical address, so search engines are not left with the default "Coming soon" title.
  // Bing's checker wants a title under about 70 characters (the site name is added to the end) and a description of about 70 to 160.
  if (mode === "prelaunch") return shareMetadata({ title: "Optician and Optometrist Jobs in Canada", shareTitle: "Eye care jobs across Canada, opening soon", description: "A Canada-wide eye care job board for optometrists, opticians, assistants and clinic teams. Every job shows its pay. Join the waitlist.", path: "/" });
  return shareMetadata({ title: "Optician and Optometrist Jobs in Canada", shareTitle: "Eye care jobs across Canada", description: "A Canada-wide eye care job board for optometrists, opticians, assistants and clinic teams. Independent and corporate practices, and every job shows its pay.", path: "/" });
}

// At launch the sign up gate opens (docs/launch-checklist.md) and the launch layout takes over from the coming soon page by itself.
export default async function Home() {
  const mode = await homeModeNow();
  const page = mode === "launch" ? <LaunchHome /> : mode === "prelaunch" ? <PreLaunchHome /> : <ComingSoon />;
  // Who Kestrel is, for search engines and AI assistants. Every version of the home page carries it.
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJson() }} />
      {page}
    </>
  );
}

function ComingSoon() {
  return (
    <>
      <SiteHeader logo={false} />
      <main id="main" tabIndex={-1}>
        <section className="hero">
          <div className="wrap">
            <span className="pill">Waitlist now open</span>
            <h1 className="sr">Kestrel Eye Care Jobs: eye care jobs across Canada</h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mark" src="/logo.svg" alt="Kestrel Eye Care Jobs" width={1300} height={340} />
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
            <Image src="/skyline.png" alt="Illustration of Canadian mountains, forest and a city skyline" width={2000} height={462} priority sizes="100vw" />
          </div>
        </section>

        <HomeBelowHero />
      </main>
      <AppFooter />
    </>
  );
}
