import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Find eye care jobs | Kestrel Eye Care Jobs",
  description: "Eye care jobs across Canada, in independent and corporate practices. Job search opens soon. Join the waitlist to hear first.",
};

export default function Jobs() {
  return (
    <>
      <SiteHeader />
      <main className="simple">
        <div className="wrap">
          <span className="pill">Opening soon</span>
          <h1>Find your next eye care job</h1>
          <p>
            Search optometrist, optician, assistant and clinic team roles across every province and territory, filtered by independent or corporate practice. Job search opens soon.
          </p>
          <Link href="/#join" className="btn">Join the waitlist</Link>
          <p className="small-note">Already have an account? <Link href="/sign-in">Sign in</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
