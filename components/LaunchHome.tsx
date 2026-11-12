import Image from "next/image";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import EyeCareNumbers from "@/components/EyeCareNumbers";
import HomeBlogStrip from "@/components/HomeBlogStrip";
import JobCard from "@/components/JobCard";
import SiteHeader from "@/components/SiteHeader";
import { findYourFitOn, homeBlogOn } from "@/lib/features";
import { LANDING_PROVINCES, LANDING_ROLES, provinceHref } from "@/lib/landing";
import { CLINIC_PASS, ROLE_BANDS, dollars } from "@/lib/pricing";
import { getFilterCounts, searchJobs } from "@/lib/public-jobs";

// The home page once Kestrel has launched (docs/launch-home.md): job search first, then the latest jobs, ways to browse, the clinic
// offer and the candidate account. The coming soon page in app/page.tsx stays until launch, and lib/launch.ts decides which one shows.
export default async function LaunchHome() {
  const [{ jobs }, counts] = await Promise.all([searchJobs({}), getFilterCounts()]);
  const latest = jobs.slice(0, 6);
  const provinces = LANDING_PROVINCES.filter((p) => counts.provinces[p]);
  const roles = LANDING_ROLES.filter((r) => counts.roles[r.role]);
  const provinceOptions = provinces.length ? provinces : LANDING_PROVINCES;

  return (
    <>
      <SiteHeader launch />
      <main id="main" tabIndex={-1} className="lh">
        <section className="lh-hero" aria-labelledby="lh-title">
          <div className="wrap">
            <h1 id="lh-title">Find your next eye care job</h1>
            <p className="lh-lede">Independent and corporate practices across Canada. Every job shows its pay, and a person reads every post before it goes live.</p>
            <form method="get" action="/jobs" className="lh-search" role="search" aria-label="Search jobs">
              <label className="sr" htmlFor="lh-q">Role or keyword</label>
              <input id="lh-q" name="q" type="text" placeholder="Role or keyword, for example optician" autoComplete="off" />
              <label className="sr" htmlFor="lh-province">Province or territory</label>
              <select id="lh-province" name="province" defaultValue="">
                <option value="">All of Canada</option>
                {provinceOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <button type="submit" className="btn">Search jobs</button>
            </form>
            <p className="lh-sub">Hiring for your clinic? <Link href="/clinics" className="btn sm ghost">Post a job</Link></p>
          </div>
          <div className="lh-skyline" aria-hidden="true">
            <Image src="/skyline.png" alt="Illustration of Canadian mountains, forest and a city skyline" width={2000} height={462} priority sizes="100vw" />
          </div>
        </section>

        <section className="lh-section" aria-labelledby="lh-latest">
          <div className="wrap">
            <div className="lh-head"><h2 id="lh-latest">Latest jobs</h2><Link href="/jobs" className="btn sm ghost">See all jobs</Link></div>
            {latest.length > 0 ? (
              <div className="joblist">{latest.map((j) => <JobCard key={j.id} job={j} />)}</div>
            ) : (
              <div className="card emptystate">
                <h3>The first jobs are on their way</h3>
                <p>New jobs appear here as clinics post them. Create an account and set a job alert, and we will email you when one fits your role and province.</p>
                <p className="emptyactions"><Link href="/sign-up" className="btn">Create an account</Link></p>
              </div>
            )}
          </div>
        </section>

        {(provinces.length > 0 || roles.length > 0) && (
          <section className="lh-section lh-browse" aria-labelledby="lh-browse">
            <div className="wrap">
              <h2 id="lh-browse">Browse by province and role</h2>
              <div className="lh-cols">
                <div>
                  <h3>Province</h3>
                  <ul className="landlinks">
                    {provinces.map((p) => <li key={p}><Link href={provinceHref(p)}>{p}<span className="count">({counts.provinces[p]})</span></Link></li>)}
                  </ul>
                </div>
                <div>
                  <h3>Role</h3>
                  <ul className="landlinks">
                    {roles.map((r) => <li key={r.slug}><Link href={`/jobs?role=${encodeURIComponent(r.role)}`}>{r.name}<span className="count">({counts.roles[r.role]})</span></Link></li>)}
                  </ul>
                </div>
              </div>
              <p className="lh-all"><Link href="/eye-care-jobs" className="btn sm ghost">All provinces and roles</Link></p>
            </div>
          </section>
        )}

        <section className="lh-clinics" aria-labelledby="lh-clinics-h">
          <div className="wrap lh-clinicsgrid">
            <div>
              <p className="kicker">For clinics</p>
              <h2 id="lh-clinics-h">Hire people who chose eye care</h2>
              <p>Candidates pick a role, a province and the kind of practice before they see your post, so the people who apply have picked you for a reason. Every post shows its pay range, a person reads it before it goes live, and agencies cannot post.</p>
            </div>
            <div className="lh-offer">
              <p className="lh-offerhead">Free to post while we launch</p>
              <p>After that, a 30 day post starts at {dollars(ROLE_BANDS[0].price)}, or the Clinic pass is {dollars(CLINIC_PASS.monthly)} a month for up to {CLINIC_PASS.livePosts} live posts. No charge by the click.</p>
              <p className="lh-offeractions">
                <Link href="/clinics" className="btn">Post a job</Link>
                <Link href="/compare" className="btn ghost">Compare prices</Link>
              </p>
            </div>
          </div>
        </section>

        <section className="lh-section" aria-labelledby="lh-pay">
          <div className="wrap lh-pay">
            <h2 id="lh-pay">What does the job pay?</h2>
            <p>See typical pay for each role in every province, from the Government of Canada&apos;s Job Bank, before you apply or write your own ad.</p>
            <p>
              <Link href="/resources#pay" className="btn ghost">Typical pay by province</Link>
              {findYourFitOn() && <> <Link href="/find-your-fit" className="btn ghost">Find your fit</Link></>}
            </p>
          </div>
        </section>

        <section className="split"><EyeCareNumbers /></section>

        {homeBlogOn() && <HomeBlogStrip />}

        <section className="lh-account" aria-labelledby="lh-account-h">
          <div className="wrap">
            <h2 id="lh-account-h">Keep your resume in one place</h2>
            <p>Save your resume once and apply in a few clicks. Set job alerts, follow every application, and see jobs picked for your role.</p>
            <p><Link href="/sign-up" className="btn">Create a free account</Link></p>
            <p className="help">Already have an account? <Link href="/sign-in">Sign in</Link></p>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
