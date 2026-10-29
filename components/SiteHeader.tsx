import Link from "next/link";

// The menu across the top of the public pages. On a phone it folds into a Menu button.
// Find jobs and For clinics point at placeholder pages until the real ones are built.
export default function SiteHeader({ logo = true }: { logo?: boolean }) {
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
          <Link href="/clinics">For clinics</Link>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/#join" className="btn sm">Join the waitlist</Link>
        </nav>

        <details className="site-narrow">
          <summary>Menu</summary>
          <nav aria-label="Main menu">
            <Link href="/jobs">Find jobs</Link>
            <Link href="/clinics">For clinics</Link>
            <Link href="/sign-in">Sign in</Link>
            <Link href="/#join">Join the waitlist</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
