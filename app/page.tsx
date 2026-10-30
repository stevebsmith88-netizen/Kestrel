import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import WaitlistForm from "@/components/WaitlistForm";

export default function ComingSoon() {
  return (
    <>
      <SiteHeader logo={false} />
      <main id="main" tabIndex={-1}>
        <section className="hero">
          <div className="wrap">
            <span className="pill">Coming soon</span>
            <h1 className="sr">Kestrel Eye Care Jobs: eye care jobs across Canada</h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="mark" src="/logo.svg" alt="Kestrel" width={1300} height={340} />
            <p className="tag" aria-hidden="true">Eye care jobs</p>
            <svg className="leaf" viewBox="0 0 100 100" aria-hidden="true">
              <path fill="#A4502C" d="M50 2L57 16L64 12L61 36L75 22L79 30L93 27L89 41L97 46L77 62L81 71L57 67L56 86L52 86L52 100L48 100L48 86L44 86L43 67L19 71L23 62L3 46L11 41L7 27L21 30L25 22L39 36L36 12L43 16Z" />
            </svg>
            <p className="board">Canada-wide eye care job board</p>
            <p className="lede">
              A dedicated job board for optometrists, opticians, assistants and clinic teams, built by people who know eye care. We&apos;re launching soon.
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
              <h2>Hire people who know eye care</h2>
              <ul>
                <li>Reach optometrists, opticians and support teams in one place</li>
                <li>Independent and corporate practices, side by side</li>
                <li>Waitlist clinics will be the first invited to post</li>
              </ul>
            </article>
            <article className="card">
              <p className="kicker">For eye care professionals</p>
              <h2>Find your next role</h2>
              <ul>
                <li>Roles in clinics across every province and territory</li>
                <li>Filter by role, location and type of practice</li>
                <li>Hear about new roles first by joining the waitlist</li>
              </ul>
            </article>
          </div>
        </section>

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
          </div>
        </section>
      </main>
      <footer>
        <div className="wrap">
          <span>
            <strong>Kestrel Eye Care Jobs</strong> &middot; eyecarejobs.ca
            <span className="addr">6013 Yonge Street, 3rd Floor, North York, Ontario M2M 3W2, Canada</span>
          </span>
          <span>
            <Link href="/blog">Blog</Link> &middot; <Link href="/privacy">Privacy</Link> &middot; <Link href="/terms">Terms</Link> &middot; <Link href="/posting-policy">Posting policy</Link> &middot; <Link href="/contact">Contact</Link> &middot; &copy; {new Date().getFullYear()} Kestrel Eye Care Jobs
          </span>
        </div>
      </footer>
    </>
  );
}
