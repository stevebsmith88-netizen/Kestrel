import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import HelpCentre from "@/components/HelpCentre";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { HELP } from "@/content/help";
import { HELP_DESCRIPTION, HELP_TITLE, helpFaqJsonLd } from "@/lib/help";
import { signupsOpen } from "@/lib/signup-gate";
import { shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({ title: HELP_TITLE, description: HELP_DESCRIPTION, path: "/help" });

// The date a person last checked these answers against the site. Change it, and PAGE_DATES.help in lib/page-dates.ts, when the help changes
// (lib/page-dates.test.ts checks that they agree).
const UPDATED = "12th November 2026";

export default async function Help() {
  const session = await getSession();
  const open = await signupsOpen();
  return (
    <>
      <SiteHeader session={session} />
      {/* Every topic as a question and answer, built from the same words the page shows (audit P1-52). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(helpFaqJsonLd(HELP)).replace(/</g, "\\u003c") }} />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">Help centre</p>
          <h1>Help for people using Kestrel</h1>
          <p className="lede2">Short answers and step by step guides for candidates and clinics who have an account. Open a heading to read it. Looking for hiring advice? Try the <Link href="/blog">blog</Link>. Cannot find what you need? <Link href="/contact">Contact us</Link>.</p>
          {!open && <p className="note">Kestrel is opening soon. These answers describe how it works once you have an account.</p>}
          <HelpCentre sections={HELP} />
          <p className="help-updated">Last updated {UPDATED}.</p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
