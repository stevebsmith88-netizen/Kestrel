import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import { homeFor, type Session } from "@/lib/auth";
import { findYourFitOn } from "@/lib/features";
import { launchLayoutOn } from "@/lib/launch";
import { TAGLINE } from "@/lib/launch-rules";

// The menu across the top of the public pages. On a phone it folds into a Menu button.
// Pages that know who is signed in pass `session`, so a signed in person sees a way back to
// their own dashboard instead of "Sign in" and "Join the waitlist".
// Once Kestrel has launched (lib/launch.ts), the wordmark carries the tagline under it and the call to action is Create account, not the waitlist.
export default async function SiteHeader({ logo = true, session = null, launch }: { logo?: boolean; session?: Session | null; launch?: boolean }) {
  const dashboard = session ? homeFor(session.role) : null;
  const launched = launch ?? (await launchLayoutOn());
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
            {launched && <span className="site-tag">{TAGLINE}</span>}
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
          <summary>Menu</summary>
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
