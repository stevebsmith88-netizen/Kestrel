import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import BlogBody from "@/components/BlogBody";
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

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export function generateStaticParams() {
  return visiblePosts(POSTS).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = visiblePosts(POSTS).find((p) => p.slug === slug);
  if (!post) return {};
  const share = shareMetadata({ title: post.title, description: post.description, path: `/blog/${post.slug}`, type: "article" });
  return { ...share, openGraph: { ...share.openGraph, type: "article", publishedTime: post.date, modifiedTime: post.updated ?? post.date, url: `${SITE}/blog/${post.slug}` } };
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = visiblePosts(POSTS).find((p) => p.slug === slug);
  if (!post) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: [`${SITE}/brand/kestrel-share-1200x630.png`],
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { "@type": "Organization", name: "Kestrel Eye Care Jobs", url: SITE },
    publisher: { "@type": "Organization", name: "Kestrel Eye Care Jobs", logo: { "@type": "ImageObject", url: `${SITE}/brand/kestrel-lockup-full.png` } },
    mainEntityOfPage: `${SITE}/blog/${post.slug}`,
    inLanguage: "en-CA",
  };
  const more = visiblePosts(POSTS).filter((p) => p.slug !== post.slug && isPublished(p)).slice(0, 2);
  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main id="main" tabIndex={-1} className="legal">
        <article className="wrap legal-wrap">
          <p className="back"><Link href="/blog">All articles</Link></p>
          {!isPublished(post) && <p className="notice" role="note">Scheduled for {longDate(post.date)}. Only previews can see this page until then.</p>}
          <h1>{post.title}</h1>
          <p className="updated">By The Kestrel team · {longDate(post.date)} · {readingMinutes(post.body)} min read</p>
          <BlogBody body={post.body} />
          <section className="card blogcta" aria-labelledby="blogcta-h">
            <h2 id="blogcta-h">Looking for work, or hiring?</h2>
            <p>Kestrel is a Canada-wide eye care job board for clinics and professionals. See typical pay by province and the hiring rules on our <Link href="/resources">Resources page</Link>.</p>
            <p className="formbtns"><Link href="/jobs" className="btn">Find jobs</Link><Link href="/clinics" className="btn ghost">Post a job</Link></p>
          </section>
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
