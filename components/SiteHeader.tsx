import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";
import { ACCOUNT_MENU } from "@/lib/account-menu";
import { connection } from "next/server";
import { signOut } from "@/lib/auth-actions";
import { getSession, homeFor, type Session } from "@/lib/auth";
import { findYourFitOn } from "@/lib/features";
import { homeModeNow } from "@/lib/launch";
import { TAGLINE } from "@/lib/launch-rules";

// The menu across the top of the public pages. On a phone it folds into a Menu button.
// A signed in person sees a way back to their own dashboard instead of "Sign in" and "Join the waitlist".
// A page that has already looked up the session can pass it in. Every other page leaves it out and the header looks it up itself,
// so the home page, For clinics and the policy pages never show a signed in person as signed out (the lookup is shared within a
// request, so passing it in or not costs the same).
// In the new look (pre launch and launch, lib/launch.ts) the wordmark carries the tagline under it. Once launched, the call to action is
// Create account, not the waitlist.
export default async function SiteHeader({ logo = true, session: passed, launch, tagline }: { logo?: boolean; session?: Session | null; launch?: boolean; tagline?: boolean }) {
  // Says plainly that this header depends on who is asking, so the page is never served from a shared copy that shows someone else's state.
  if (passed === undefined) await connection();
  const session = passed === undefined ? await getSession() : passed;
  const dashboard = session ? homeFor(session.role) : null;
  // `launch` and `tagline` let a page that already knows which look it has (the launch and pre launch home pages) say so.
  const mode = launch ? "launch" : tagline ? "prelaunch" : await homeModeNow();
  const launched = mode === "launch";
  // A signed in person gets the same links as the account pages (components/AppBar.tsx), and the plain wordmark without the tagline.
  const fit = findYourFitOn() ? [{ href: "/find-your-fit", label: "Find your fit" }] : [];
  const signedInLinks = !session ? [] : session.role === "candidate"
    ? [{ href: dashboard!, label: "My dashboard" }, { href: "/jobs", label: "Find jobs" }, ...fit, { href: "/candidate/alerts", label: "Job alerts" }]
    : session.role === "clinic"
      ? [{ href: dashboard!, label: "My dashboard" }, { href: "/clinic/jobs/new", label: "Post a job" }, { href: "/jobs", label: "Live jobs" }]
      : [{ href: dashboard!, label: "Overview" }, { href: "/jobs", label: "Live jobs" }];
  const join = launched ? { href: "/sign-up", label: "Create account" } : { href: "/#join", label: "Join the waitlist" };
  return (
    <header className="site">
      <div className="wrap">
        {logo ? (
          <div className="site-brand">
            <Link href="/" className="site-logo" aria-label="Kestrel Eye Care Jobs, home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={session ? 132 : 101} height={session ? 39 : 30} />
            </Link>
            {mode !== "coming-soon" && !session && (
              <>
                {/* The small chestnut maple leaf from the brand files separates the wordmark from the tagline when they sit side by side. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="site-leaf" src="/brand/kestrel-maple-leaf.svg" alt="" width={14} height={14} aria-hidden="true" />
                <span className="site-tag">{TAGLINE}</span>
              </>
            )}
          </div>
        ) : (
          <span />
        )}

        <nav className="site-wide" aria-label="Main">
          {session ? (
            signedInLinks.map((l) => <Link key={l.href} href={l.href} className={l.href === dashboard ? "dashlink" : undefined}>{l.label}</Link>)
          ) : (
            <>
              <Link href="/jobs">Find jobs</Link>
              {findYourFitOn() && <Link href="/find-your-fit">Find your fit</Link>}
              <Link href="/clinics">For clinics</Link>
              <Link href="/sign-in">Sign in</Link>
              <Link href={join.href} className="btn sm">{join.label}</Link>
            </>
          )}
        </nav>
        {session && <AccountMenu session={session} className="site-who" />}

        <details className="site-narrow">
          <summary><svg className="menu-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg><span className="sr">Menu</span></summary>
          <nav aria-label="Main menu">
            {session ? signedInLinks.map((l) => <Link key={l.href} href={l.href} className={l.href === dashboard ? "dashlink" : undefined}>{l.label}</Link>) : (
              <>
                <Link href={join.href} className="menu-cta">{join.label}</Link>
                <Link href="/jobs">Find jobs</Link>
                {findYourFitOn() && <Link href="/find-your-fit">Find your fit</Link>}
                <Link href="/clinics">For clinics</Link>
              </>
            )}
            {session ? (
              <>
                {ACCOUNT_MENU[session.role].map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
                <p className="menu-who">{session.fullName || session.email}</p>
                <form action={signOut}><button type="submit" className="menu-signout-narrow">Sign out</button></form>
              </>
            ) : (
              <Link href="/sign-in">Sign in</Link>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
