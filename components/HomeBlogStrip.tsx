import Link from "next/link";
import { POSTS } from "@/content/posts";
import { excerpt, isPublished, readingMinutes, visiblePosts } from "@/lib/blog";
import { longDate } from "@/lib/jobs";

// The newest posts, on the home page: 1 larger feature with the start of the article, and the next 2 as plain links.
// Plain links, so people and search engines can both find the articles. The order is the order in content/posts.ts (newest first).
export default function HomeBlogStrip() {
  const latest = visiblePosts([...POSTS]).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const [feature, ...others] = latest;
  if (!feature) return null;
  const when = (p: (typeof latest)[number]) => (isPublished(p) ? longDate(p.date) : `Scheduled for ${longDate(p.date)}`);
  return (
    <section className="blogstrip" aria-labelledby="blogstrip-h">
      <div className="wrap">
        <p className="kicker">From the blog</p>
        <h2 id="blogstrip-h">Advice for clinics and eye care professionals</h2>
        <div className="stripgrid">
          <article className="featured">
            <p className="meta">{when(feature)} · {readingMinutes(feature.body)} min read</p>
            <h3><Link href={`/blog/${feature.slug}`}>{feature.title}</Link></h3>
            <p className="teaser">{excerpt(feature.body)}</p>
            <p className="readmore"><Link href={`/blog/${feature.slug}`}>Read the article</Link></p>
          </article>
          {others.length > 0 && (
            <ul className="striplinks">
              {others.map((p) => (
                <li key={p.slug}>
                  <span className="meta">{when(p)}</span>
                  <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="stripmore"><Link href="/blog">See all articles</Link></p>
      </div>
    </section>
  );
}
