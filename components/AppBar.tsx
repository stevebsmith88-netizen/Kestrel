import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import { homeFor, type Role, type Session } from "@/lib/auth";

const NAV: Record<Role, { href: string; label: string }[]> = {
  candidate: [
    { href: "/candidate", label: "Home" },
    { href: "/jobs", label: "Find jobs" },
    { href: "/find-your-fit", label: "Find your fit" },
    { href: "/candidate/applications", label: "My applications" },
    { href: "/candidate/profile", label: "Profile and CV" },
    { href: "/candidate/alerts", label: "Job alerts" },
    { href: "/account", label: "Account" },
  ],
  clinic: [
    { href: "/clinic", label: "Dashboard" },
    { href: "/clinic/jobs/new", label: "Post a job" },
    { href: "/clinic/profile", label: "Clinic profile" },
    { href: "/jobs", label: "Live jobs" },
    { href: "/account", label: "Account" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/review", label: "Review queue" },
    { href: "/admin/claims", label: "Claims" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/waitlist", label: "Waitlist" },
    { href: "/admin/suppressions", label: "Do not email" },
    { href: "/jobs", label: "Live jobs" },
  ],
};

// The bar across the top of every signed in page. Pass the page's own address as
// `current` and its link is highlighted. On a phone the links fold into a Menu button.
export default function AppBar({ session, current }: { session: Session; current?: string }) {
  const here = current ?? homeFor(session.role);
  const links = NAV[session.role];
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href={homeFor(session.role)} className="topbar-logo" aria-label="Kestrel Eye Care Jobs, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={132} height={39} />
        </Link>
        <nav className="app-wide" aria-label="Main">
          {links.map((item) => (
            <Link key={item.href} href={item.href} aria-current={here === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-who app-wide">
          <span>{session.fullName || session.email}</span>
          <form action={signOut}>
            <button type="submit" className="linkbtn">Sign out</button>
          </form>
        </div>
        <details className="site-narrow app-narrow">
          <summary>Menu</summary>
          <nav aria-label="Main menu">
            {links.map((item) => (
              <Link key={item.href} href={item.href} aria-current={here === item.href ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
            <p className="menu-who">{session.fullName || session.email}</p>
            <form action={signOut}><button type="submit" className="menu-signout-narrow">Sign out</button></form>
          </nav>
        </details>
      </div>
    </header>
  );
}
