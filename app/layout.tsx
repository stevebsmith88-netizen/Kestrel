import type { Metadata, Viewport } from "next";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/poppins/400.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "@fontsource/source-sans-3/700.css";
import "./globals.css";
import CloseMenuOnEscape from "@/components/CloseMenuOnEscape";
import DemoBanner from "@/components/DemoBanner";
import { demoMode } from "@/lib/demo";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // The demo copy of the site must never appear in search results.
  ...(demoMode() ? { robots: { index: false, follow: false } } : {}),
  title: "Kestrel Eye Care Jobs | Coming soon",
  description:
    "Kestrel Eye Care Jobs is a dedicated job board for optometrists, opticians, assistants and clinic teams across Canada. Join the waitlist to hear first when we launch.",
  openGraph: {
    title: "Kestrel Eye Care Jobs | Coming soon",
    description: "Eye care jobs across Canada. Join the waitlist to hear first when we launch.",
    images: [{ url: "/brand/kestrel-share-1200x630.png", width: 1200, height: 630, alt: "Kestrel Eye Care Jobs" }],
    locale: "en_CA",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#1B2B4B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA">
      <body>
        <a className="skip" href="#main">Skip to main content</a>
        <CloseMenuOnEscape />
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
