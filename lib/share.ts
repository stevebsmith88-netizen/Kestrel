import type { Metadata } from "next";

// The title, description and picture that show when a link to a page is shared (WhatsApp, LinkedIn, Facebook, email).
// A page that sets its own Open Graph details replaces the site's wholesale, so every page that can be shared
// builds them here. Without this, every link previewed as "Coming soon, join the waitlist".
const SITE_NAME = "Kestrel Eye Care Jobs";
const IMAGE = "/brand/kestrel-lockup-full.png";

export function shareMetadata({ title, description, path, type = "website", shareTitle }: { title: string; description: string; path: string; type?: "website" | "article"; shareTitle?: string }): Metadata {
  const shown = shareTitle ?? title;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: path },
    openGraph: { title: shown, description, url: path, siteName: SITE_NAME, locale: "en_CA", type, images: [{ url: IMAGE, alt: SITE_NAME }] },
    twitter: { card: "summary", title: shown, description, images: [IMAGE] },
  };
}
