import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { CLINIC_PASS, CLINIC_PASS_PLUS, ROLE_BANDS, dollars, passBreakEven, perDay, perPassPost } from "@/lib/pricing";
import { shareMetadata } from "@/lib/share";

// Saved once and shown to everyone, then built again at most every 5 minutes (audit P1-10). force-static means that even if something on
// the page tried to read who is visiting, it would see nobody, so a saved page can never hold anything about a person. The rebuild brings
// in scheduled blog posts on their date, and the launch switch, which the header checks every 5 minutes (lib/launch.ts).
export const revalidate = 300;
export const dynamic = "force-static";

export const metadata: Metadata = shareMetadata({
  title: "Post eye care jobs in Canada",
  description: "Post jobs and reach eye care professionals across Canada. Join the waitlist to be first invited to post.",
  path: "/clinics",
});

const OPTICIAN_BAND = ROLE_BANDS[1];

export default function Clinics() {
  const pickAt = passBreakEven(OPTICIAN_BAND.price);
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="simple">
        <div className="wrap">
          <span className="pill">Opening soon</span>
          <h1>Hire people who want to work in eye care</h1>
          <p className="lede2">
            Kestrel is a job board for eye care in Canada. Your post sits next to other eye care jobs, and the people reading it came looking for exactly that kind of work.
          </p>
          <p>
            Clinics often say the big job sites bring a flood of applications from people who click Apply on everything. On Kestrel, candidates choose a role, a province and the kind of practice they want before they see your post, so the people who apply have picked you for a reason.
          </p>
          <p>
            Independent practices and corporate groups post side by side, with the same tools. Whether you are hiring one optician or filling roles at several locations, you see every applicant with their resume and cover letter. Your contact details stay private.
          </p>
          <p>
            Every post shows its pay range and answers 2 questions: is this an existing vacancy, and is AI used to screen applicants? The form asks for them on every post, wherever the clinic is, and a post cannot go live without them. Ontario&apos;s rules apply to employers with 25 or more employees, and British Columbia has its own pay range rule. <Link href="/resources/ontario-job-ads">Read what the Ontario rules ask of a clinic</Link>.
          </p>
          <p>
            Outside recruiters, staffing agencies and job brokers cannot post on Kestrel or contact candidates through it. A corporate group&apos;s own recruiting team can post for the group&apos;s own locations, so every ad you stand next to comes from the employer that is hiring.
          </p>
          <p>
            You do not need a polished ad to start. Write a few lines about the role and the ad builder gives you a draft to edit. A person reads each post before it goes live, and once it does you follow every applicant in one place.
          </p>
          <section className="pricing" aria-labelledby="pricing-h">
            <h2 id="pricing-h">One price. 30 days.</h2>
            <p className="pricing-free">Free to post while we launch, for the opening 30 to 60 days.</p>
            <p>After launch, a 30 day post costs around the price of a coffee a day. No charge by the click.</p>
            <table className="ladder">
              <caption>Per 30 day post, before HST</caption>
              <thead>
                <tr><th scope="col">Role</th><th scope="col">A day</th><th scope="col">Per post</th></tr>
              </thead>
              <tbody>
                {ROLE_BANDS.map((b) => (
                  <tr key={b.key}>
                    <th scope="row">{b.label}<span>{b.covers}</span></th>
                    <td>{perDay(b.price)}</td>
                    <td className="price">{dollars(b.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="passbox">
              <p className="passhead"><strong>Clinic pass</strong> from <span className="price">{dollars(CLINIC_PASS.monthly)}</span> a month</p>
              <p>Up to {CLINIC_PASS.livePosts} live posts at once, {perPassPost()} a post, for support, patient care, optician and practice lead roles, plus a featured clinic profile.</p>
              <p className="passpick"><strong>Our pick if you are hiring for {pickAt} or more roles at once.</strong> {pickAt} optician posts cost {dollars(pickAt * OPTICIAN_BAND.price)} one at a time and {dollars(CLINIC_PASS.monthly)} on the pass. With 1 or 2 roles, single posts cost less.</p>
              <p className="plusrow"><strong>Clinic pass Plus</strong> <span className="price">{dollars(CLINIC_PASS_PLUS.monthly)}</span> a month. {perPassPost(CLINIC_PASS_PLUS)} a post, with optometrist roles included.</p>
            </div>
            <div className="foundbox">
              <p className="foundhead">Founding clinics</p>
              <p>Join during launch and keep your pass price for {CLINIC_PASS.lockMonths} months, or until you cancel. Or pay for the year up front, {dollars(CLINIC_PASS.yearly)} on the Clinic pass or {dollars(CLINIC_PASS_PLUS.yearly)} on Plus, which is 2 months free.</p>
            </div>
            <p className="small-note">Prices in Canadian dollars, before HST. Near the end of its 30 days, any post can be extended for another 30.</p>
          </section>
          <p>Waitlist clinics will be the first invited to post.</p>
          <Link href="/#join" className="btn">Join the waitlist</Link>
          <p className="small-note">Already have an account? <Link href="/sign-in">Sign in</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
