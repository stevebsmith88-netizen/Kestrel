import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { readingMinutes } from "@/lib/blog";
import { longDate } from "@/lib/jobs";
import { POSTS } from "@/content/posts";
import { isPublished, visiblePosts } from "@/lib/blog";
import { shareMetadata } from "@/lib/share";

// Saved once and shown to everyone, then built again at most every 5 minutes (audit P1-10). force-static means that even if something on
// the page tried to read who is visiting, it would see nobody, so a saved page can never hold anything about a person. The rebuild brings
// in scheduled blog posts on their date, and the launch switch, which the header checks every 5 minutes (lib/launch.ts).
export const revalidate = 300;
export const dynamic = "force-static";

export const metadata: Metadata = shareMetadata({
  title: "Eye care hiring and career advice",
  description: "Plain advice for Canadian clinics and eye care professionals: writing job ads, applying for jobs, pay, and field based roles.",
  path: "/blog",
});

export default async function Blog() {
  const posts = visiblePosts([...POSTS]).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Eye care hiring and career advice</h1>
          <p className="lede2">Plain advice for Canadian clinics and eye care professionals, from the team building Kestrel.</p>
          <div className="postlist">
            {posts.map((p) => (
              <article className="card" key={p.slug}>
                <p className="meta">{isPublished(p) ? longDate(p.date) : `Scheduled for ${longDate(p.date)} (only visible on previews)`} · {readingMinutes(p.body)} min read</p>
                <h2><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2>
                <p>{p.description}</p>
                <p><Link href={`/blog/${p.slug}`} className="btn sm ghost">Read the article</Link></p>
              </article>
            ))}
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
