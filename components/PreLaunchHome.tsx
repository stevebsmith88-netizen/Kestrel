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
            <Image src="/skyline.png" alt="Illustration of Canadian mountains, forest and a city skyline" width={2000} height={462} priority sizes="100vw" />
          </div>
        </section>
        <section className="lh-section lh-shots" aria-labelledby="pl-shots">
          <div className="wrap">
            <h2 id="pl-shots">What the board will look like</h2>
            <p className="lh-shotslede">Search by role, province, type of employer and distance, then see the pay before you open a job. These are sample screens with sample clinics and jobs. Real jobs take their place when Kestrel opens.</p>
            <div className="lh-shotgrid">
              <figure>
                <Image src="/home/sample-search.png" alt="The Kestrel job search page, with a search box, filters for role, province, employer type, city and distance, and the first jobs listed with their pay." width={2160} height={1540} sizes="(max-width: 860px) 100vw, 620px" />
                <figcaption>Search and filter. Every job card shows its pay.</figcaption>
              </figure>
              <figure>
                <Image src="/home/sample-job.png" alt="A Kestrel job page, with the job description, a Quick Apply button, and job facts that include pay, location, whether it is an existing vacancy, and whether AI is used to screen candidates." width={2160} height={1496} sizes="(max-width: 860px) 100vw, 520px" />
                <figcaption>A job page. Pay, vacancy and AI screening are stated up front.</figcaption>
              </figure>
            </div>
          </div>
        </section>
        <HomeBelowHero />
      </main>
      <AppFooter />
    </>
  );
}
