import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import DraftNotice from "@/components/DraftNotice";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Posting policy | Kestrel Eye Care Jobs",
  description: "What every job posted on Kestrel must include, and what is not allowed.",
};

const UPDATED = "30th October 2026";
const DRAFT = true;

export default async function PostingPolicy() {
  return (
    <>
      <SiteHeader session={await getSession()} />
      <main id="main" tabIndex={-1} className="legal">
        <div className="wrap legal-wrap">
          <h1>Posting policy</h1>
          <p className="updated">Last updated {UPDATED}</p>
          {DRAFT && <DraftNotice />}

          <p>
            This policy is for clinics that post jobs on Kestrel. It keeps the board honest and fair for candidates, and it keeps your post in good standing.
            It is part of our <Link href="/terms">terms of use</Link>. We read every post before it goes live.
          </p>

          <h2>Who may post</h2>
          <ul>
            <li>Clinics and practices hiring directly for their own team, independent or corporate. Corporate groups may post for their own locations.</li>
            <li>Recruiters, staffing agencies and job brokers may not post, and may not contact candidates through Kestrel.</li>
            <li>You confirm this when you set up your clinic profile.</li>
          </ul>

          <h2>What every post must include</h2>
          <ul>
            <li><strong>A pay range</strong> for the job, as a yearly salary or an hourly rate. The range should be genuine. Unless the top of the range is over $200,000 a year, it may not be more than $50,000 wide (hourly rates are counted over a standard year of 2,080 hours).</li>
            <li><strong>Whether this is an existing vacancy</strong>, answered honestly with yes or no. Please do not advertise a job that does not exist.</li>
            <li><strong>Whether you use artificial intelligence to screen candidates</strong>, answered honestly with yes or no.</li>
            <li>The role, the type of work (full time, part time, locum or contract), and the city and province.</li>
            <li>A clear description of the job in your own words.</li>
          </ul>

          <h2>What is not allowed</h2>
          <ul>
            <li><strong>Discrimination.</strong> Posts must not prefer or exclude people because of race, ancestry, colour, ethnic origin, citizenship, place of origin, religion, sex, gender identity or expression, sexual orientation, age, marital or family status, disability, or any other ground protected by human rights law. Please do not include wording about age, appearance, accent or family plans. Requirements must relate to the work, such as registration, qualifications and skills.</li>
            <li><strong>&quot;Canadian experience&quot; requirements.</strong> Please do not ask for it. You may ask for the skills and qualifications the job needs.</li>
            <li><strong>Fees charged to candidates</strong>, or any request for money, a deposit or banking details.</li>
            <li><strong>Misleading posts</strong>: wrong pay, wrong location, a different job from the one described, or a job that is already filled.</li>
            <li><strong>Posts from agencies</strong>, including &quot;our client&quot; or &quot;confidential employer&quot; posts.</li>
            <li><strong>Contact details in the text.</strong> Please leave email addresses, phone numbers and web links out of the description. Candidates apply through Kestrel, or through a clinic application page you give us.</li>
            <li>Anything unlawful, offensive or unrelated to eye care hiring.</li>
          </ul>

          <h2>How posts are reviewed</h2>
          <ul>
            <li>Each post is read by our team before it is published. We may send it back to you with a note on what to change.</li>
            <li>A published post stays live for 30 days, then it expires. You can close it sooner, for example when the role is filled.</li>
            <li>A clinic can have up to 10 open jobs at a time (drafts, in review and live together). Monthly passes include up to 5 live posts.</li>
            <li>We may take down a post at any time if it breaks this policy, or after a report. We will tell you, and you can fix and resubmit it.</li>
          </ul>

          <h2>Looking after applicants</h2>
          <ul>
            <li>Please open and answer applications. Candidates can see whether you have viewed their application, and we remind you when applications have waited too long.</li>
            <li>When a job is filled or closed, update the status of the applicants so no one is left waiting.</li>
            <li>Use applicants&apos; details only for hiring for the job they applied for, unless they agree to be kept in mind for future roles.</li>
          </ul>

          <h2>If we remove a post or close an account</h2>
          <p>
            Repeated or serious breaches, such as posting as a recruiter, a scam, or discriminatory content, may lead to a suspended account. If you believe we made a
            mistake, write to <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a> and a person will look at it.
          </p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
