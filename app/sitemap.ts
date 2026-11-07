import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/lib/sitemap-entries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return sitemapEntries();
}
