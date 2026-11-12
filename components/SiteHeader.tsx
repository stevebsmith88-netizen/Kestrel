import Link from "next/link";
import AppBar from "@/components/AppBar";
import SessionBar from "@/components/SessionBar";
import type { Session } from "@/lib/auth";
import { findYourFitOn } from "@/lib/features";
import { homeModeNow } from "@/lib/launch";
import { TAGLINE } from "@/lib/launch-rules";
import { SIGNED_IN_COOKIE } from "@/lib/session-cookie";

// The menu across the top of the public pages. On a phone it folds into a Menu button.
// A page that already knows who is signed in (a page built fresh for each visit, such as Find jobs) passes the session in, and a signed
// in person gets their account bar (components/AppBar.tsx) drawn on the server.
// A page that passes nothing is saved once and shown to everyone (audit P1-10), so this header never looks up who is asking and is always
// drawn signed out. A line of script marks the page when the browser holds a sign in cookie, which hides the Sign in links at once, and
// components/SessionBar.tsx then draws the same account bar in the browser. Nothing about the person is ever in the saved page.
// In the new look (pre launch and launch, lib/launch.ts) the wordmark carries the tagline under it. Once launched, the call to action is
// Create account, not the waitlist.
export default async function SiteHeader({ logo = true, session, launch, tagline }: { logo?: boolean; session?: Session | null; launch?: boolean; tagline?: boolean }) {
  // A signed in person gets exactly the bar the account pages have, so it never moves between pages.
  if (session) return <AppBar session={session} current="" />;
  const saved = session === undefined;
  // `launch` and `tagline` let a page that already knows which look it has (the launch and pre launch home pages) say so.
  const mode = launch ? "launch" : tagline ? "prelaunch" : await homeModeNow();
  const launched = mode === "launch";
  const join = launched ? { href: "/sign-up", label: "Create account" } : { href: "/#join", label: "Join the waitlist" };
  return (
    <>
    {saved && <script dangerouslySetInnerHTML={{ __html: `try{if(${SIGNED_IN_COOKIE}.test(document.cookie))document.documentElement.classList.add("has-session")}catch(e){}` }} />}
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
          <Link href="/clinics">For clinics</Link>
          <Link href="/sign-in">Sign in</Link>
          <Link href={join.href} className="btn sm">{join.label}</Link>
        </nav>

        <details className="site-narrow">
          <summary><svg className="menu-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg><span className="sr">Menu</span></summary>
          <nav aria-label="Main menu">
            <Link href={join.href} className="menu-cta">{join.label}</Link>
            <Link href="/jobs">Find jobs</Link>
            {findYourFitOn() && <Link href="/find-your-fit">Find your fit</Link>}
            <Link href="/clinics">For clinics</Link>
            <Link href="/sign-in">Sign in</Link>
          </nav>
        </details>
      </div>
    </header>
    {saved && <SessionBar quiz={findYourFitOn()} />}
    </>
  );
}
