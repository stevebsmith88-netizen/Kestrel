import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import Icon from "@/components/Icon";
import NavLinks from "@/components/NavLinks";
import { unreadCount } from "@/lib/notifications";
import { ACCOUNT_MENU } from "@/lib/account-menu";
import { signOut } from "@/lib/auth-actions";
import { homeFor, type Role, type Session } from "@/lib/auth";
import { findYourFitOn } from "@/lib/features";

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
    { href: "/account", label: "Account settings" },
  ],
  clinic: [
    { href: "/clinic", label: "My dashboard" },
    { href: "/clinic/jobs/new", label: "Post a job" },
    { href: "/clinic/profile", label: "Clinic profile" },
    { href: "/jobs", label: "Live jobs" },
    { href: "/account", label: "Account settings" },
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
export default async function AppBar({ session, current }: { session: Session; current?: string }) {
  // Candidates and clinics have an inbox, shown as an envelope beside the initials with the number of unread messages.
  const hasInbox = session.role !== "admin";
  const unread = hasInbox ? await unreadCount() : 0;
  const here = current ?? homeFor(session.role);
  const links = session.role === "candidate" && findYourFitOn() ? [...NAV.candidate.slice(0, 2), QUIZ, ...NAV.candidate.slice(2)] : NAV[session.role];
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
        <Link href={homeFor(session.role)} className="topbar-logo" aria-label="Kestrel Eye Care Jobs, home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={132} height={39} />
        </Link>
        <nav className="app-wide" aria-label="Main">
          <NavLinks links={barLinks} dashboard={homeFor(session.role)} />
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
              <Link key={item.href} href={item.href} className={item.href === homeFor(session.role) ? "dashlink" : undefined} aria-current={here === item.href ? "page" : undefined}>
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
