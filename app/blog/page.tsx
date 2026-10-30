import type { Metadata } from "next";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { readingMinutes } from "@/lib/blog";
import { longDate } from "@/lib/jobs";
import { POSTS } from "@/content/posts";

export const metadata: Metadata = {
  title: "Eye care hiring and career advice | Kestrel Eye Care Jobs",
  description: "Plain advice for Canadian clinics and eye care professionals: writing job ads, applying for jobs, pay, and field based roles.",
  alternates: { canonical: "/blog" },
};

export default async function Blog() {
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <SiteHeader session={await getSession()} />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">The Kestrel blog</p>
          <h1>Eye care hiring and career advice</h1>
          <p className="lede2">Plain advice for Canadian clinics and eye care professionals, from the team building Kestrel.</p>
          <div className="postlist">
            {posts.map((p) => (
              <article className="card" key={p.slug}>
                <p className="meta">{longDate(p.date)} · {readingMinutes(p.body)} min read</p>
                <h2><Link href={`/blog/${p.slug}`}>{p.title}</Link></h2>
                <p>{p.description}</p>
                <p><Link href={`/blog/${p.slug}`}>Read the article</Link></p>
              </article>
            ))}
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
