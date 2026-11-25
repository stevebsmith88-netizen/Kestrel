import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";

// Built fresh for every visit, as it was before audit P1-10. Only the pages Steve listed are saved and shared; this one was not on the list.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account deleted | Kestrel Eye Care Jobs", robots: { index: false } };

export default function Goodbye() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="simple">
        <div className="wrap">
          <span className="pill">All done</span>
          <h1>Your account is deleted</h1>
          <p>Your profile, your files and your applications have been removed. Thank you for trying Kestrel. You are always welcome back.</p>
          <Link href="/" className="btn">Back to Kestrel</Link>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
