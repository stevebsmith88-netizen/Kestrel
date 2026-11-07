import Image from "next/image";
import Link from "next/link";
import EyeCareNumbers from "@/components/EyeCareNumbers";
import HomeBlogStrip from "@/components/HomeBlogStrip";
import { comparePageOn } from "@/lib/compare-prices";
import { homeBlogOn } from "@/lib/features";
import SiteHeader from "@/components/SiteHeader";
import WaitlistForm from "@/components/WaitlistForm";

// Built ahead of time, and rebuilt at least hourly, so a scheduled post appears on the home page soon after its date.
export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

// Tells search engines and AI assistants who we are. The same name, line and logo are used everywhere. Social page
// links (sameAs) are added when those pages exist.
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
    },
    { "@type": "WebSite", "@id": `${SITE}/#website`, name: "Kestrel Eye Care Jobs", url: SITE, inLanguage: "en-CA", publisher: { "@id": `${SITE}/#organization` } },
  ],
};

export default function ComingSoon() {
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

        <section className="split">
          <div className="wrap cards">
            <article className="card">
              <p className="kicker">For clinics</p>
              <h2>Be seen by people who want eye care work</h2>
              <p>
                On the big job sites, a clinic&apos;s post can sink among thousands of others, and clinics often say they get applicants who click Apply on everything. Here, everyone searching is looking for work in eye care.
              </p>
              <ul>
                <li>Independent and corporate practices post side by side</li>
                <li>Waitlist clinics will be the first invited to post</li>
              </ul>
              {comparePageOn() && (
                <p>
                  <Link href="/compare">See how our prices compare</Link> with other places to advertise an eye care job.
                </p>
              )}
            </article>
            <article className="card">
              <p className="kicker">For eye care professionals</p>
              <h2>Find a job that fits, then see where it can lead</h2>
              <ul>
                <li>Search eye care jobs only, so you are not scrolling past everything else</li>
                <li>Filter by role, province and type of practice, from independent clinics to suppliers</li>
                <li>Roles run from assistant and optician to manager, trainer and field rep, so you can see where a career could go</li>
                <li>Every job shows its pay</li>
              </ul>
            </article>
          </div>
          <EyeCareNumbers />
        </section>

        {homeBlogOn() && <HomeBlogStrip />}

        <section className="join" id="join">
          <div className="wrap grid">
            <div className="intro">
              <h2>Be first through the door</h2>
              <p>Whether you&apos;re hiring or looking, join the waitlist and we&apos;ll let you know the moment Kestrel opens.</p>
            </div>
            <div className="panel">
              <WaitlistForm />
              <p className="privacy">
                We&apos;ll only use your details to email you about Kestrel Eye Care Jobs, and you can unsubscribe at any time. Read our{" "}
                <Link href="/privacy">privacy policy</Link>.
              </p>
            </div>
            <div className="next">
              <h3>What happens next</h3>
              <p>We send a link to confirm your address. Press it and you are on the list.</p>
              <p>
                When Kestrel opens, you hear from us first. Clinics post a job with its pay range, a person reads every post before it goes live, and candidates see the pay on each job.
              </p>
              <p>
                While you wait, see <Link href="/resources#pay">typical pay by province</Link> or read the <Link href="/blog">blog</Link> for help with interviews, CVs and job ads.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="wrap">
          <span>
            <strong>Kestrel Eye Care Jobs</strong> &middot; eyecarejobs.ca
          </span>
          <span>
            <Link href="/eye-care-jobs">Jobs by province</Link> &middot; <Link href="/blog">Blog</Link> &middot; <Link href="/resources">Resources</Link> &middot; <Link href="/compare">Compare prices</Link> &middot; <Link href="/privacy">Privacy</Link> &middot; <Link href="/terms">Terms</Link> &middot; <Link href="/posting-policy">Posting policy</Link> &middot; <Link href="/contact">Contact</Link> &middot; &copy; {new Date().getFullYear()} Kestrel Eye Care Jobs
          </span>
        </div>
      </footer>
    </>
  );
}
