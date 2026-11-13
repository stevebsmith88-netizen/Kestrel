import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import { POSTS } from "@/content/posts";
import { visiblePosts } from "@/lib/blog";
import { longDate } from "@/lib/jobs";
import { launchLayoutOn } from "@/lib/launch";
import { TAGLINE } from "@/lib/launch-rules";
import { shareMetadata } from "@/lib/share";
import { LINKEDIN_URL } from "@/lib/social";

// The "link in bio" page for Instagram (Steve, 13th November 2026): Kestrel's own version of a Linktree, so visitors stay on
// eyecarejobs.ca and the waitlist still records where they came from. Link to it as /links?utm_source=instagram&utm_medium=social&utm_campaign=bio.
// The newest guides list themselves as each blog post reaches its date, so the page never needs editing.
// Saved and shared like the other content pages (audit P1-10): it never knows who is looking.
export const revalidate = 300;
export const dynamic = "force-static";

export const metadata: Metadata = {
  ...shareMetadata({
    title: "Links",
    description: "Join the Kestrel Eye Care Jobs waitlist and read the latest career and hiring guides for eye care in Canada.",
    path: "/links",
  }),
  // A page of links only, so it stays out of search results and the sitemap.
  robots: { index: false, follow: true },
};

const LATEST_GUIDES = 6;

export default async function Links() {
  const launched = await launchLayoutOn();
  const guides = visiblePosts([...POSTS], new Date(), false)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, LATEST_GUIDES);
  return (
    <>
      <main id="main" tabIndex={-1} className="linkpage">
        <div className="lp-wrap">
          <Link href="/" className="lp-brand" aria-label="Kestrel Eye Care Jobs, home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kestrel-wordmark.svg" alt="Kestrel Eye Care Jobs" width={240} height={71} />
          </Link>
          <p className="lp-tag">{TAGLINE}</p>
          <p className="lp-intro">Every job shows its pay. Career and hiring guides written for people who work in eye care.</p>

          <div className="lp-actions">
            {launched ? (
              <>
                <Link href="/jobs" className="btn">Find eye care jobs</Link>
                <Link href="/clinics" className="btn ghost">Post a job</Link>
              </>
            ) : (
              <Link href="/#join" className="btn">Join the waitlist</Link>
            )}
            <Link href="/blog" className="btn ghost">Read all the guides</Link>
          </div>

          <h1 className="lp-head">The latest guides</h1>
          <ul className="lp-list">
            {guides.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`}>
                  <span className="lp-title">{p.title}</span>
                  <span className="lp-date">{longDate(p.date)}</span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="lp-follow">
            Also on <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </p>
        </div>
        <div className="lp-skyline" aria-hidden="true">
          <Image src="/skyline.png" alt="" width={2000} height={462} sizes="100vw" />
        </div>
      </main>
      <AppFooter />
    </>
  );
}
