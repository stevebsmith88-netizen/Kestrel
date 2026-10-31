import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/candidate", "/clinic/", "/clinic$", "/dashboard", "/account", "/claim", "/welcome", "/goodbye", "/auth", "/unsubscribe", "/sign-in", "/sign-up", "/forgot-password", "/reset-password"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
