import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="simple">
        <div className="wrap">
          <span className="pill">Page not found</span>
          <h1>We can&apos;t find that page</h1>
          <p>The link may be old, or the job may have closed. Here are some places to go instead.</p>
          <Link href="/jobs" className="btn">See all jobs</Link>
          <p className="small-note"><Link href="/">Go to the home page</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
