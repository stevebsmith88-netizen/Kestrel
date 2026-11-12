import Link from "next/link";
import EyeCareNumbers from "@/components/EyeCareNumbers";
import HomeBlogStrip from "@/components/HomeBlogStrip";
import WaitlistForm from "@/components/WaitlistForm";
import { comparePageOn } from "@/lib/compare-prices";
import { homeBlogOn } from "@/lib/features";

// Everything under the top of the home page before launch: the two cards, the numbers box, the blog strip and the waitlist form.
// The coming soon page and the pre launch page (components/PreLaunchHome.tsx) both use it, so the waitlist form is in 1 place.
export default function HomeBelowHero() {
  return (
    <>
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
                <li>Jobs run for 30 days at a time, so you are not scrolling past ads from last year</li>
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
                While you wait, see <Link href="/resources#pay">typical pay by province</Link> or read the <Link href="/blog">blog</Link> for help with interviews, resumes and job ads.
              </p>
            </div>
          </div>
        </section>
    </>
  );
}
