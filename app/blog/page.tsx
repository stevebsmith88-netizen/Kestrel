import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { readingMinutes } from "@/lib/blog";
import { longDate } from "@/lib/jobs";
import { POSTS } from "@/content/posts";
import { BLOG_TOPICS, isPublished, visiblePosts } from "@/lib/blog";
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

// The newest published posts (never a scheduled one, even on a preview), then 1 tile per topic that jumps to that topic's list (Steve, 14th November 2026). Every post is on the page
// in full, nothing is hidden behind a click, and no post's address changes.
const LATEST = 3;

export default async function Blog() {
  const posts = visiblePosts([...POSTS]).sort((a, b) => b.date.localeCompare(a.date));
  const when = (date: string) => (isPublished({ date }) ? longDate(date) : `Scheduled for ${longDate(date)}, previews only`);
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>Eye care hiring and career advice</h1>
          <p className="lede2">Plain advice for Canadian clinics and eye care professionals, from the team building Kestrel.</p>
          <nav className="topictiles" aria-label="Blog topics">
            {BLOG_TOPICS.map((t) => (
              <a key={t.id} href={`#${t.id}`} className="topictile">
                <span className="topictile-name">{t.label}</span>
                <span className="topictile-count">{posts.filter((p) => p.topic === t.id).length} articles</span>
              </a>
            ))}
          </nav>
          <h2 className="bloghead">Latest</h2>
          <div className="postlist">
            {posts.filter((p) => isPublished(p)).slice(0, LATEST).map((p) => (
              <article className="card" key={p.slug}>
                <p className="meta">{when(p.date)} · {readingMinutes(p.body)} min read</p>
                <h2><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2>
                <p>{p.description}</p>
                <p><Link href={`/blog/${p.slug}`} className="btn sm ghost">Read the article</Link></p>
              </article>
            ))}
          </div>
          {BLOG_TOPICS.map((t) => {
            const inTopic = posts.filter((p) => p.topic === t.id);
            if (!inTopic.length) return null;
            return (
              <section key={t.id} id={t.id} className="topicsection" aria-labelledby={`${t.id}-h`}>
                <h2 id={`${t.id}-h`} className="bloghead">{t.label}</h2>
                <p className="topicblurb">{t.blurb}</p>
                <ul className="postrows">
                  {inTopic.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                      <span className="postrow-meta">{when(p.date)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
