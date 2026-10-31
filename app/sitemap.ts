import type { MetadataRoute } from "next";
import { POSTS } from "@/content/posts";
import { visiblePosts } from "@/lib/blog";
import { findYourFitOn } from "@/lib/features";
import { listLiveJobIds } from "@/lib/public-jobs";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await listLiveJobIds();
  const quiz = findYourFitOn() ? [{ url: `${SITE}/find-your-fit`, changeFrequency: "monthly" as const, priority: 0.6 }] : [];
  return [
    ...quiz,
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/clinics`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ...visiblePosts(POSTS, new Date(), false).map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: p.updated ?? p.date, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/posting-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...jobs.map((j) => ({ url: `${SITE}/jobs/${j.id}`, lastModified: j.updated_at ?? j.posted_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
