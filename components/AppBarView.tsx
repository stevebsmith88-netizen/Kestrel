import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import Icon from "@/components/Icon";
import NavLinks from "@/components/NavLinks";
import { signOut } from "@/lib/auth-actions";
import { ACCOUNT_MENU, homeOf, type BarPerson } from "@/lib/account-menu";
import type { Role } from "@/lib/auth";

type NavItem = { href: string; label: string };
const QUIZ: NavItem = { href: "/find-your-fit", label: "Find your fit" };
// Links that are in the account menu (lib/account-menu.ts) sit under the initials badge on wide screens. On a phone every link is in the Menu button.
const NAV: Record<Role, NavItem[]> = {
  candidate: [
    { href: "/candidate", label: "My dashboard" },
    { href: "/jobs", label: "Find jobs" },
    { href: "/candidate/applications", label: "My applications" },
    { href: "/candidate/profile", label: "Profile and resume" },
    { href: "/candidate/alerts", label: "Job alerts" },
    { href: "/account/help", label: "Help and feedback" },
    { href: "/account", label: "Account settings" },
  ],
  clinic: [
    { href: "/clinic", label: "My dashboard" },
    { href: "/clinic/jobs/new", label: "Post a job" },
    { href: "/clinic/profile", label: "Clinic profile" },
    { href: "/clinic/team", label: "Clinic team" },
    { href: "/clinic/locations", label: "Locations" },
    { href: "/clinic/billing", label: "Billing" },
    { href: "/jobs", label: "Live jobs" },
    { href: "/account/help", label: "Help and feedback" },
    { href: "/account", label: "Account settings" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/review", label: "Review queue" },
    { href: "/admin/requests", label: "Help requests" },
    { href: "/admin/clinics", label: "Clinics" },
    { href: "/admin/claims", label: "Claims" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/waitlist", label: "Waitlist" },
    { href: "/admin/suppressions", label: "Do not email" },
    { href: "/jobs", label: "Live jobs" },
  ],
};

// What the bar across the top of every signed in page looks like. It reads nothing itself, so the server (components/AppBar.tsx) and the
// browser (components/SessionBar.tsx, on the public pages that are saved once for everyone, audit P1-10) draw exactly the same bar.
// Pass the page's own address as `current` and its link is highlighted. On a phone the links fold into a Menu button.
export default function AppBarView({ session, current, unread, quiz }: { session: BarPerson; current?: string; unread: number; quiz: boolean }) {
  // Candidates and clinics have an inbox, shown as an envelope beside the initials with the number of unread messages.
  const hasInbox = session.role !== "admin";
  const here = current ?? homeOf(session.role);
  const links = session.role === "candidate" && quiz ? [...NAV.candidate.slice(0, 2), QUIZ, ...NAV.candidate.slice(2)] : NAV[session.role];
  const inMenu = new Set(ACCOUNT_MENU[session.role].map((l) => l.href));
  const barLinks = links.filter((l) => !inMenu.has(l.href));
  // The envelope with its count. It sits beside the initials on a wide screen and beside the Menu button on a phone, so the count is always in view.
  const envelope = hasInbox && (
    <Link href="/account/inbox" className="inboxlink" aria-label={unread > 0 ? `Inbox, ${unread} unread` : "Inbox"} aria-current={here === "/account/inbox" ? "page" : undefined}>
      <Icon name="mail" />
      {unread > 0 && <span className="inboxcount" aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
    </Link>
  );
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href={homeOf(session.role)} className="topbar-logo" aria-label="Kestrel Eye Care Jobs, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={132} height={39} />
        </Link>
        <nav className="app-wide" aria-label="Main">
          <NavLinks links={barLinks} dashboard={homeOf(session.role)} />
        </nav>
        <div className="topbar-right app-wide">
          {envelope}
          <AccountMenu session={session} here={here} />
        </div>
        <div className="topbar-narrow">
        {envelope}
        <details className="site-narrow">
          <summary><svg className="menu-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg><span className="sr">Menu</span></summary>
          <nav aria-label="Main menu">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className={item.href === homeOf(session.role) ? "dashlink" : undefined} aria-current={here === item.href ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
            {hasInbox && <Link href="/account/inbox" aria-current={here === "/account/inbox" ? "page" : undefined}>{unread > 0 ? `Inbox (${unread})` : "Inbox"}</Link>}
            <p className="menu-who">{session.fullName || session.email}</p>
            <form action={signOut}><button type="submit" className="menu-signout-narrow">Sign out</button></form>
          </nav>
        </details>
        </div>
      </div>
    </header>
  );
}
