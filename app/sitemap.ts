import type { MetadataRoute } from "next";
import { listLiveJobIds } from "@/lib/public-jobs";

export const revalidate = 3600;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await listLiveJobIds();
  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/jobs`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/clinics`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...jobs.map((j) => ({ url: `${SITE}/jobs/${j.id}`, lastModified: j.posted_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
