import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import { homeFor, type Session } from "@/lib/auth";
import { findYourFitOn } from "@/lib/features";
import { homeModeNow } from "@/lib/launch";
import { TAGLINE } from "@/lib/launch-rules";

// The menu across the top of the public pages. On a phone it folds into a Menu button.
// Pages that know who is signed in pass `session`, so a signed in person sees a way back to
// their own dashboard instead of "Sign in" and "Join the waitlist".
// In the new look (pre launch and launch, lib/launch.ts) the wordmark carries the tagline under it. Once launched, the call to action is
// Create account, not the waitlist.
export default async function SiteHeader({ logo = true, session = null, launch, tagline }: { logo?: boolean; session?: Session | null; launch?: boolean; tagline?: boolean }) {
  const dashboard = session ? homeFor(session.role) : null;
  // `launch` and `tagline` let a page that already knows which look it has (the launch and pre launch home pages) say so.
  const mode = launch ? "launch" : tagline ? "prelaunch" : await homeModeNow();
  const launched = mode === "launch";
  const join = launched ? { href: "/sign-up", label: "Create account" } : { href: "/#join", label: "Join the waitlist" };
  return (
    <header className="site">
      <div className="wrap">
        {logo ? (
          <div className="site-brand">
            <Link href="/" className="site-logo" aria-label="Kestrel Eye Care Jobs, home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={101} height={30} />
            </Link>
            {mode !== "coming-soon" && (
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
          <Link href="/jobs">Find jobs</Link>
          {findYourFitOn() && <Link href="/find-your-fit">Find your fit</Link>}
          {!session && <Link href="/clinics">For clinics</Link>}
          {session?.role === "clinic" && <Link href="/clinic/jobs/new">Post a job</Link>}
          {session ? (
            <>
              <form action={signOut}><button type="submit" className="linkbtn menu-signout">Sign out</button></form>
              <Link href={dashboard!} className="btn sm">My dashboard</Link>
            </>
          ) : (
            <>
              <Link href="/sign-in">Sign in</Link>
              <Link href={join.href} className="btn sm">{join.label}</Link>
            </>
          )}
        </nav>

        <details className="site-narrow">
          <summary><svg className="menu-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg><span className="sr">Menu</span></summary>
          <nav aria-label="Main menu">
            {session ? <Link href={dashboard!} className="menu-cta">My dashboard</Link> : <Link href={join.href} className="menu-cta">{join.label}</Link>}
            <Link href="/jobs">Find jobs</Link>
            {findYourFitOn() && <Link href="/find-your-fit">Find your fit</Link>}
            {!session && <Link href="/clinics">For clinics</Link>}
            {session?.role === "clinic" && <Link href="/clinic/jobs/new">Post a job</Link>}
            {session ? (
              <form action={signOut}><button type="submit" className="menu-signout-narrow">Sign out</button></form>
            ) : (
              <Link href="/sign-in">Sign in</Link>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
