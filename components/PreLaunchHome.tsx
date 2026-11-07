import Image from "next/image";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import HomeBelowHero from "@/components/HomeBelowHero";
import SiteHeader from "@/components/SiteHeader";

// The home page before launch in the new look (docs/launch-home.md): the same header and styling as the launch page, with the waitlist as the
// call to action. Everything under the top is shared with the original coming soon page, so the waitlist form lives in 1 place.
export default function PreLaunchHome() {
  return (
    <>
      <SiteHeader tagline />
      <main id="main" tabIndex={-1} className="lh">
        <section className="lh-hero" aria-labelledby="pl-title">
          <div className="wrap">
            <span className="pill">Waitlist now open</span>
            <h1 id="pl-title">Eye care jobs across Canada, opening soon</h1>
            <p className="lh-lede">
              A job board for eye care in Canada, built by someone with over 20 years in the industry. Optometrists, opticians, assistants, clinic teams and suppliers, in one place. Every job shows its pay, and a person reads every post before it goes live.
            </p>
            <p className="lh-ctas">
              <a className="btn" href="#join">Join the waitlist</a>
              <Link href="/clinics" className="btn ghost">Hiring? See how it works</Link>
            </p>
          </div>
          <div className="lh-skyline" aria-hidden="true">
            <Image src="/skyline.png" alt="" width={2000} height={462} priority sizes="100vw" />
          </div>
        </section>
        <HomeBelowHero />
      </main>
      <AppFooter />
    </>
  );
}
