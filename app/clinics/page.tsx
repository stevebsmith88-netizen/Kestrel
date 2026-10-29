import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "For clinics | Kestrel Eye Care Jobs",
  description: "Post jobs and reach eye care professionals across Canada. Join the waitlist to be first invited to post.",
};

export default function Clinics() {
  return (
    <>
      <SiteHeader />
      <main className="simple">
        <div className="wrap">
          <span className="pill">Opening soon</span>
          <h1>Hire people who know eye care</h1>
          <p>
            Post a job in minutes, see every applicant with their CV and cover letter, and keep your contact details private. Waitlist clinics will be the first invited to post.
          </p>
          <Link href="/#join" className="btn">Join the waitlist</Link>
          <p className="small-note">Already have an account? <Link href="/sign-in">Sign in</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
