// "Fill in from my website" on the clinic profile, with no AI (Steve, 14th November 2026). Most websites carry short labels written for
// search engines and for link previews: the site's name, a 1 or 2 sentence description, and often the business's town and province in a
// standard format (schema.org). This reads only those labels, with fixed rules. It never reads the page's own wording, and nothing is
// saved: the clinic sees what was found and chooses what to use.
import { decodeEntities } from "./page-reader.ts";
import { PROVINCES, QUEBEC } from "./waitlist.ts";

export type SiteDetails = { name?: string; about?: string; city?: string; province?: string };

const clean = (text: string, max: number) => decodeEntities(text.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim().slice(0, max);

// The attributes of every <meta> tag, whatever order they are written in.
function metaTags(html: string): Record<string, string>[] {
  const out: Record<string, string>[] = [];
  for (const m of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs: Record<string, string> = {};
    for (const a of m[1].matchAll(/([a-z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? "";
    out.push(attrs);
    if (out.length > 300) break;
  }
  return out;
}

function meta(tags: Record<string, string>[], key: string) {
  const tag = tags.find((t) => (t.property ?? t.name ?? "").toLowerCase() === key);
  return tag?.content ? clean(tag.content, 3000) : "";
}

const BUSINESS_TYPES = /^(LocalBusiness|MedicalBusiness|MedicalClinic|Optician|Optometric|Physician|Store|HealthAndBeautyBusiness|Organization|Corporation|ProfessionalService)$/;

// The first business described in the page's structured data, including inside @graph lists.
function businessIn(value: unknown, depth = 0): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || depth > 4) return null;
  if (Array.isArray(value)) {
    for (const v of value) {
      const found = businessIn(v, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const obj = value as Record<string, unknown>;
  const types = ([] as unknown[]).concat(obj["@type"] ?? []).map(String);
  if (types.some((t) => BUSINESS_TYPES.test(t))) return obj;
  return businessIn(obj["@graph"], depth + 1);
}

const ABBREVIATIONS: Record<string, string> = { AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick", NL: "Newfoundland and Labrador", NS: "Nova Scotia", NT: "Northwest Territories", NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island", PEI: "Prince Edward Island", QC: QUEBEC, SK: "Saskatchewan", YT: "Yukon" };

// A province written in full or as its 2 letter short form. Quebec is left out, since Kestrel does not take Quebec jobs yet.
export function provinceFrom(text: string): string | undefined {
  const value = text.trim().replace(/\./g, "");
  const full = ABBREVIATIONS[value.toUpperCase()] ?? (PROVINCES as readonly string[]).find((p) => p.toLowerCase() === value.toLowerCase());
  return full && full !== QUEBEC ? full : undefined;
}

// "Northgate Eye Care | Optometrists in Kelowna" gives "Northgate Eye Care".
const nameFromTitle = (title: string) => clean(title.split(/\s+[|–—-]\s+|\s+::\s+/)[0] ?? "", 160);

export function siteDetails(html: string): SiteDetails {
  const page = html.slice(0, 2_000_000);
  const tags = metaTags(page.slice(0, 300_000));
  let business: Record<string, unknown> | null = null;
  for (const m of page.matchAll(/<script[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      business = businessIn(JSON.parse(m[1].trim()));
    } catch {
      // Broken structured data is common. The other labels are still read.
    }
    if (business) break;
  }
  const text = (v: unknown, max: number) => (typeof v === "string" ? clean(v, max) : "");
  const address = (Array.isArray(business?.address) ? business?.address[0] : business?.address) as Record<string, unknown> | undefined;
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(page)?.[1] ?? "";

  const name = text(business?.name, 160) || meta(tags, "og:site_name").slice(0, 160) || nameFromTitle(title);
  const about = meta(tags, "description") || meta(tags, "og:description") || text(business?.description, 3000);
  const city = address && typeof address === "object" ? text(address.addressLocality, 80) : "";
  const province = address && typeof address === "object" ? provinceFrom(text(address.addressRegion, 40)) : undefined;
  const found: SiteDetails = {};
  if (name) found.name = name;
  if (about) found.about = about;
  if (city) found.city = city;
  if (province) found.province = province;
  return found;
}
