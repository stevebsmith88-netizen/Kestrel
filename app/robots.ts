import type { MetadataRoute } from "next";
import { demoMode } from "@/lib/demo";
import { AI_CRAWLERS, PRIVATE_PATHS } from "@/lib/crawlers";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export default function robots(): MetadataRoute.Robots {
  // The demo site asks every search engine to stay away.
  if (demoMode()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] },
      // The AI assistants' crawlers are welcome to the same public pages (Steve, 13th November 2026). Named here so the choice is on record:
      // a named group replaces the "*" group for that crawler, so it carries the same private paths.
      { userAgent: [...AI_CRAWLERS], allow: "/", disallow: [...PRIVATE_PATHS] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
