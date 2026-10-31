import Link from "next/link";
import { POSTS } from "@/content/posts";
import { readingMinutes } from "@/lib/blog";
import { longDate } from "@/lib/jobs";

// The 3 newest blog posts, on the home page. Plain links, so people and search engines can both find the articles.
export default function HomeBlogStrip() {
  const latest = [...POSTS].sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug)).slice(0, 3);
  return (
    <section className="blogstrip" aria-labelledby="blogstrip-h">
      <div className="wrap">
        <p className="kicker">From the blog</p>
        <h2 id="blogstrip-h">Advice for clinics and eye care professionals</h2>
        <div className="striplist">
          {latest.map((p) => (
            <article className="card" key={p.slug}>
              <p className="meta">{longDate(p.date)} · {readingMinutes(p.body)} min read</p>
              <h3><Link href={`/blog/${p.slug}`}>{p.title}</Link></h3>
              <p>{p.description}</p>
            </article>
          ))}
        </div>
        <p className="stripmore"><Link href="/blog">See all articles</Link></p>
      </div>
    </section>
  );
}
