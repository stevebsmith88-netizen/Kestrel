"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown when a page fails to load. Forms that fail to send keep what was typed and show a message instead (see useServerForm).
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Page error:", error.digest ?? error.message);
  }, [error]);
  return (
    <main id="main" tabIndex={-1} className="simple">
      <div className="wrap">
        <span className="pill">Something went wrong</span>
        <h1>That didn&apos;t work</h1>
        <p>We hit a problem on our side. Nothing you have already saved has been lost. Please try again, and if it keeps happening, email <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a>.</p>
        <button type="button" className="btn" onClick={reset}>Try again</button>
        <p className="small-note"><Link href="/">Go to the home page</Link></p>
        {error.digest && <p className="small-note">Reference: {error.digest}</p>}
      </div>
    </main>
  );
}
