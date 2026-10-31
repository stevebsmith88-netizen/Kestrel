import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: "For clinics",
  description: "Post jobs and reach eye care professionals across Canada. Join the waitlist to be first invited to post.",
  path: "/clinics",
});

export default function Clinics() {
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
            Independent practices and corporate groups post side by side, with the same tools. Whether you are hiring one optician or filling roles at several locations, you see every applicant with their CV and cover letter. Your contact details stay private.
          </p>
          <p>
            Every post shows its pay range and answers 2 questions: is this an existing vacancy, and is AI used to screen applicants?
          </p>
          <p>Waitlist clinics will be the first invited to post.</p>
          <Link href="/#join" className="btn">Join the waitlist</Link>
          <p className="small-note">Already have an account? <Link href="/sign-in">Sign in</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
