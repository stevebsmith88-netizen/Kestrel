import Link from "next/link";
import { comparePageOn } from "@/lib/compare-prices";
import { findYourFitOn } from "@/lib/features";
import { TAGLINE } from "@/lib/launch-rules";

// The one footer for every page. The wordmark is the existing reversed brand file. The street address is not shown here: CASL needs it
// in emails only. Find your fit and Compare prices appear only while those pages are switched on, so a link never leads to a 404.
export default function AppFooter() {
  const candidates = [
    { href: "/jobs", label: "Find jobs" },
    { href: "/eye-care-jobs", label: "Jobs by province" },
    ...(findYourFitOn() ? [{ href: "/find-your-fit", label: "Find your fit" }] : []),
    { href: "/blog", label: "Blog" },
  ];
  const clinics = [
    { href: "/clinics", label: "Post a job" },
    ...(comparePageOn() ? [{ href: "/compare", label: "Compare prices" }] : []),
    { href: "/resources", label: "Resources" },
  ];
  const company = [
    { href: "/help", label: "Help" },
    { href: "/contact", label: "Contact" },
    { href: "/security", label: "Security" },
    { href: "/resources#data-sources", label: "Data sources" },
  ];
  const columns = [
    { id: "foot-candidates", heading: "For candidates", links: candidates },
    { id: "foot-clinics", heading: "For clinics", links: clinics },
    { id: "foot-company", heading: "Company", links: company },
  ];
  return (
    <footer className="sitefoot">
      <div className="wrap">
        <nav aria-label="Footer">
          <div className="sf-top">
            <div className="sf-brand">
              <Link href="/" aria-label="Kestrel Eye Care Jobs, home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/kestrel-wordmark-reversed.svg" alt="Kestrel Eye Care Jobs" width={150} height={44} />
              </Link>
              <p>{TAGLINE}</p>
            </div>
            {columns.map((c) => (
              <div className="sf-col" key={c.id}>
                <p className="sf-head" id={c.id}>{c.heading}</p>
                <ul aria-labelledby={c.id}>
                  {c.links.map((l) => (
                    <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="sf-bottom">
            <ul className="sf-legal">
              <li><Link href="/privacy">Privacy</Link></li>
              <li><Link href="/terms">Terms</Link></li>
              <li><Link href="/posting-policy">Posting policy</Link></li>
              <li><Link href="/fake-jobs">Report a fake job</Link></li>
            </ul>
            <p className="sf-copy">&copy; {new Date().getFullYear()} Kestrel Eye Care Jobs</p>
          </div>
        </nav>
      </div>
    </footer>
  );
}
