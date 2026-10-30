import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Account deleted | Kestrel Eye Care Jobs", robots: { index: false } };

export default function Goodbye() {
  return (
    <>
      <SiteHeader />
      <main className="simple">
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
