import "server-only";
import type { MetadataRoute } from "next";
import { comparePageOn } from "@/lib/compare-prices";
import { POSTS } from "@/content/posts";
import { visiblePosts } from "@/lib/blog";
import { demoMode } from "@/lib/demo";
import { findYourFitOn } from "@/lib/features";
import { LANDING_PROVINCES, LANDING_ROLES, comboHref, landingIndexable, provinceHref } from "@/lib/landing";
import { PAGE_DATES } from "@/lib/page-dates";
import { getComboCounts, listLiveJobIds } from "@/lib/public-jobs";

// Every public page that belongs in the sitemap. The sitemap and the "tell search engines about every page" button both use it, so
// they can never disagree.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export async function sitemapEntries(): Promise<MetadataRoute.Sitemap> {
  if (demoMode()) return [];
  const [jobs, combos] = await Promise.all([listLiveJobIds(), getComboCounts()]);
  // Landing pages only when they have live jobs, the same rule that lets Google index them.
  const provinceCount = (p: string) => Object.entries(combos).filter(([k]) => k.startsWith(`${p}|`)).reduce((n, [, c]) => n + c, 0);
  const landing = [
    ...(Object.keys(combos).length ? [{ url: `${SITE}/eye-care-jobs`, changeFrequency: "daily" as const, priority: 0.8 }] : []),
    ...LANDING_PROVINCES.filter((p) => landingIndexable(provinceCount(p))).map((p) => ({ url: `${SITE}${provinceHref(p)}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...LANDING_PROVINCES.flatMap((p) => LANDING_ROLES.filter((r) => landingIndexable(combos[`${p}|${r.role}`] ?? 0)).map((r) => ({ url: `${SITE}${comboHref(p, r)}`, changeFrequency: "daily" as const, priority: 0.8 }))),
  ];
  const quiz = findYourFitOn() ? [{ url: `${SITE}/find-your-fit`, changeFrequency: "monthly" as const, priority: 0.6 }] : [];
  return [
    ...quiz,
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/jobs`, changeFrequency: "daily", priority: 0.9 },
    ...landing,
    { url: `${SITE}/clinics`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/resources/ontario-job-ads`, lastModified: PAGE_DATES.ontarioJobAds, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/resources`, lastModified: PAGE_DATES.resources, changeFrequency: "monthly", priority: 0.6 },
    ...(comparePageOn() ? [{ url: `${SITE}/compare`, lastModified: PAGE_DATES.compare, changeFrequency: "monthly" as const, priority: 0.5 }] : []),
    ...visiblePosts(POSTS, new Date(), false).map((p) => ({ url: `${SITE}/blog/${p.slug}`, lastModified: p.updated ?? p.date, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${SITE}/privacy`, lastModified: PAGE_DATES.privacy, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/security`, lastModified: PAGE_DATES.security, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/terms`, lastModified: PAGE_DATES.terms, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/posting-policy`, lastModified: PAGE_DATES.postingPolicy, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/contact`, changeFrequency: "yearly", priority: 0.3 },
    ...jobs.map((j) => ({ url: `${SITE}/jobs/${j.id}`, lastModified: j.posted_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
