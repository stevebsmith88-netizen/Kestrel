import Link from "next/link";
import { signOut } from "@/lib/auth-actions";
import { homeFor, type Session } from "@/lib/auth";

// The menu across the top of the public pages. On a phone it folds into a Menu button.
// Pages that know who is signed in pass `session`, so a signed in person sees a way back to
// their own dashboard instead of "Sign in" and "Join the waitlist".
export default function SiteHeader({ logo = true, session = null }: { logo?: boolean; session?: Session | null }) {
  const dashboard = session ? homeFor(session.role) : null;
  return (
    <header className="site">
      <div className="wrap">
        {logo ? (
          <Link href="/" className="site-logo" aria-label="Kestrel Eye Care Jobs, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={101} height={30} />
          </Link>
        ) : (
          <span />
        )}

        <nav className="site-wide" aria-label="Main">
          <Link href="/jobs">Find jobs</Link>
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
              <Link href="/#join" className="btn sm">Join the waitlist</Link>
            </>
          )}
        </nav>

        <details className="site-narrow">
          <summary>Menu</summary>
          <nav aria-label="Main menu">
            {session ? <Link href={dashboard!} className="menu-cta">My dashboard</Link> : <Link href="/#join" className="menu-cta">Join the waitlist</Link>}
            <Link href="/jobs">Find jobs</Link>
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
