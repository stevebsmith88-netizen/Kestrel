import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import BlogBody from "@/components/BlogBody";
import SiteHeader from "@/components/SiteHeader";
import { getSession } from "@/lib/auth";
import { readingMinutes } from "@/lib/blog";
import { longDate } from "@/lib/jobs";
import { POSTS } from "@/content/posts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | Kestrel Eye Care Jobs`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.description, type: "article", publishedTime: post.date, modifiedTime: post.updated ?? post.date, url: `${SITE}/blog/${post.slug}`, locale: "en_CA" },
  };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Organization", name: "Kestrel Eye Care Jobs", url: SITE },
    publisher: { "@type": "Organization", name: "Kestrel Eye Care Jobs", logo: { "@type": "ImageObject", url: `${SITE}/brand/kestrel-lockup-full.png` } },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
    inLanguage: "en-CA",
  };
  const more = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);
  return (
    <>
      <SiteHeader session={await getSession()} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main id="main" tabIndex={-1} className="legal">
        <article className="wrap legal-wrap">
          <p className="back"><Link href="/blog">All articles</Link></p>
          <h1>{post.title}</h1>
          <p className="updated">By The Kestrel team · {longDate(post.date)} · {readingMinutes(post.body)} min read</p>
          <BlogBody body={post.body} />
          <aside className="card blogcta">
            <h2>Looking for work, or hiring?</h2>
            <p>Kestrel is a Canada-wide eye care job board for clinics and professionals.</p>
            <p className="formbtns"><Link href="/jobs" className="btn">Find jobs</Link><Link href="/clinics" className="btn ghost">Post a job</Link></p>
          </aside>
          {more.length > 0 && (
            <>
              <h2>More from the blog</h2>
              <ul>{more.map((p) => <li key={p.slug}><Link href={`/blog/${p.slug}`}>{p.title}</Link></li>)}</ul>
            </>
          )}
        </article>
      </main>
      <AppFooter />
    </>
  );
}
