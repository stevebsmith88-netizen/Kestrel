import Link from "next/link";
import { homeModeNow } from "@/lib/launch";
import { TAGLINE } from "@/lib/launch-rules";

// The plain page around the sign in, sign up and password forms.
export default async function AuthShell({ title, intro, children }: { title?: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <main id="main" tabIndex={-1} className="auth">
        <div className="wrap authwrap">
          <Link href="/" className="auth-logo" aria-label="Kestrel Eye Care Jobs, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={200} height={59} />
          </Link>
          {(await homeModeNow()) !== "coming-soon" && <span className="auth-tag">{TAGLINE}</span>}
          <div className="panel">
            {title && <h1>{title}</h1>}
            {intro && <p className="auth-intro">{intro}</p>}
            {children}
          </div>
        </div>
      </main>
      <footer>
        <div className="wrap">
          <span>
            <strong>Kestrel Eye Care Jobs</strong> &middot; eyecarejobs.ca
          </span>
          <span>
            <Link href="/privacy">Privacy policy</Link> &middot; <Link href="/terms">Terms of use</Link> &middot; <Link href="/help">Help</Link>
          </span>
        </div>
      </footer>
    </>
  );
}
