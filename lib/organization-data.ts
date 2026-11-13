// Tells search engines and AI assistants who we are. The same name, line and logo are used everywhere. Social page links (sameAs)
// come from lib/social.ts, the same list the footer icons use. Output by every version of the home page (app/page.tsx), not just one of them.
import { socialPages } from "./social.ts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

export function organizationData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE}/#organization`,
        name: "Kestrel Eye Care Jobs",
        url: SITE,
        logo: `${SITE}/brand/kestrel-lockup-full.png`,
        description: "A Canada-wide job board for eye care: optometrists, opticians, assistants, clinic teams and suppliers. Every job shows its pay.",
        areaServed: { "@type": "Country", name: "Canada" },
        sameAs: socialPages().map((p) => p.url),
      },
      { "@type": "WebSite", "@id": `${SITE}/#website`, name: "Kestrel Eye Care Jobs", url: SITE, inLanguage: "en-CA", publisher: { "@id": `${SITE}/#organization` } },
    ],
  };
}

// The text to put inside the script tag, with "<" escaped so nothing in it can close the tag early.
export const organizationJson = () => JSON.stringify(organizationData()).replace(/</g, "\\u003c");
