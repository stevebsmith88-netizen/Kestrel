import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import { homeFor, type Role, type Session } from "@/lib/auth";

const NAV: Record<Role, { href: string; label: string }[]> = {
  candidate: [
    { href: "/candidate", label: "Home" },
    { href: "/jobs", label: "Find jobs" },
  ],
  clinic: [
    { href: "/clinic", label: "Dashboard" },
    { href: "/clinic/profile", label: "Clinic profile" },
    { href: "/clinic/jobs/new", label: "Post a job" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/review", label: "Review queue" },
    { href: "/admin/waitlist", label: "Waitlist" },
  ],
};

// The bar across the top of every signed in page. Pass the page's own address as
// `current` and its link is highlighted.
export default function AppBar({ session, current }: { session: Session; current?: string }) {
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href={homeFor(session.role)} className="topbar-logo" aria-label="Kestrel Eye Care Jobs, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={132} height={39} />
        </Link>
        <nav aria-label="Main">
          {NAV[session.role].map((item) => (
            <Link key={item.href} href={item.href} aria-current={(current ?? homeFor(session.role)) === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-who">
          <span>{session.fullName || session.email}</span>
          <form action={signOut}>
            <button type="submit" className="linkbtn">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
