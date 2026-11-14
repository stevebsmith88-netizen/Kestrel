// Public clinic pages (Steve, 14th November 2026): an address for each clinic, such as /clinics/northgate-eye-care-kelowna, with its open
// jobs. No database change is needed: the address is worked out from the clinic's name and town, and when 2 clinics would share one, both
// get a short piece of their id on the end. Plan: docs/plans/clinic-and-supplier-pages.md.

export type PublicClinic = {
  id: string;
  clinic_name: string;
  practice_type: string;
  website: string | null;
  province: string;
  city: string;
  about: string | null;
};

// Lowercase letters and numbers joined by single hyphens, with accents taken off ("Clinique Lévis" to "clinique-levis").
export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

// The town is left off when the name already ends with it ("Kelowna Eye Care" in Kelowna stays "kelowna-eye-care").
export function baseSlug(c: Pick<PublicClinic, "clinic_name" | "city">) {
  const name = slugify(c.clinic_name) || "clinic";
  const city = slugify(c.city);
  return !city || name.endsWith(city) || name.startsWith(city) ? name : `${name}-${city}`;
}

// Every clinic's address. Clinics that would share an address each get the first 6 characters of their id added.
export function clinicSlugs(clinics: Pick<PublicClinic, "id" | "clinic_name" | "city">[]): Map<string, string> {
  const byBase = new Map<string, string[]>();
  for (const c of clinics) byBase.set(baseSlug(c), [...(byBase.get(baseSlug(c)) ?? []), c.id]);
  const out = new Map<string, string>();
  for (const c of clinics) {
    const base = baseSlug(c);
    out.set(c.id, (byBase.get(base)?.length ?? 0) > 1 ? `${base}-${c.id.replace(/-/g, "").slice(0, 6)}` : base);
  }
  return out;
}

export const clinicHref = (slug: string) => `/clinics/${slug}`;

// Google may index a clinic page when it has open jobs, or a real description. An empty page with no jobs is still there for anyone who
// has the link, but asks not to be indexed, so thin pages never reach search results.
export const MIN_ABOUT_FOR_INDEX = 80;
export const clinicIndexable = (about: string | null, liveJobs: number) => liveJobs > 0 || (about ?? "").trim().length >= MIN_ABOUT_FOR_INDEX;

export const openJobsText = (n: number) => (n === 0 ? "No open jobs right now" : n === 1 ? "1 open job" : `${n} open jobs`);

// Organization data for search engines, matching what the page shows: the name, the town, the website and the description.
export function clinicJsonLd(c: PublicClinic, slug: string, site: string) {
  return {
    "@context": "https://schema.org",
    "@type": c.practice_type === "supplier" ? "Organization" : "MedicalBusiness",
    name: c.clinic_name,
    url: `${site}${clinicHref(slug)}`,
    ...(c.website ? { sameAs: [c.website] } : {}),
    ...(c.about ? { description: c.about.slice(0, 500) } : {}),
    address: { "@type": "PostalAddress", addressLocality: c.city, addressRegion: c.province, addressCountry: "CA" },
  };
}
