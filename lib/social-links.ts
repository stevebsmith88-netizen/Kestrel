// Optional social links (Steve, 15th November 2026). A clinic can add its Instagram, Facebook and LinkedIn page to its profile, shown as small
// icons on its public page. A candidate can add a LinkedIn profile, sent to a clinic only with an application. Nothing else is accepted: the
// address must be https and on the platform's own website, so a link can never lead somewhere else, and anything after the address (a "?" part
// or a "#" part, which is often tracking) is dropped. Kept free of app imports so it can be tested on its own (lib/social-links.test.ts).

export type SocialKey = "instagram" | "facebook" | "linkedin";

export const SOCIAL_PLATFORMS: { key: SocialKey; name: string; hosts: string[]; example: string }[] = [
  { key: "instagram", name: "Instagram", hosts: ["instagram.com"], example: "https://www.instagram.com/yourclinic" },
  { key: "facebook", name: "Facebook", hosts: ["facebook.com", "fb.com"], example: "https://www.facebook.com/yourclinic" },
  { key: "linkedin", name: "LinkedIn", hosts: ["linkedin.com"], example: "https://www.linkedin.com/company/yourclinic" },
];

export type SocialLinks = Partial<Record<SocialKey, string>>;
const MAX_LENGTH = 200;

function hostMatches(host: string, allowed: string[]) {
  const h = host.toLowerCase();
  return allowed.some((a) => h === a || h.endsWith(`.${a}`));
}

// A clean address, an empty string for a blank answer, or an error message for the person to read. `kind` decides which LinkedIn page is
// right: a clinic gives a company page, a candidate gives their own profile.
export function cleanSocialUrl(key: SocialKey, raw: unknown, kind: "clinic" | "candidate" = "clinic"): { url: string; error?: undefined } | { url?: undefined; error: string } {
  const platform = SOCIAL_PLATFORMS.find((p) => p.key === key);
  const typed = typeof raw === "string" ? raw.trim() : "";
  if (!platform || !typed) return { url: "" };
  if (typed.length > MAX_LENGTH) return { error: `That ${platform.name} address is too long.` };
  // Someone who types "instagram.com/yourclinic" without the https:// is helped; any other scheme is refused below.
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(typed) ? typed : `https://${typed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { error: `Enter the full ${platform.name} address, like ${platform.example}.` };
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return { error: `Enter the full ${platform.name} address, starting with https://.` };
  if (!hostMatches(url.hostname, platform.hosts)) return { error: `That is not a ${platform.name} address. It should start with ${platform.example.replace(/\/[^/]*$/, "/")}.` };
  const path = url.pathname.replace(/\/+$/, "");
  if (path.length < 2) return { error: `Enter the address of your own ${platform.name} page. The home page on its own will not do.` };
  if (key === "linkedin") {
    const ok = kind === "candidate" ? /^\/in\/[^/]+/i.test(path) : /^\/(company|school)\/[^/]+/i.test(path);
    if (!ok) return { error: kind === "candidate" ? "Enter the address of your own LinkedIn profile, like https://www.linkedin.com/in/yourname." : "Enter the address of your LinkedIn company page, like https://www.linkedin.com/company/yourclinic." };
  }
  return { url: `https://${url.hostname.toLowerCase()}${path}` };
}

// Every clinic link from a form, with an error for each one that is not right.
export function cleanClinicSocials(raw: Partial<Record<SocialKey, unknown>>): { links: SocialLinks; errors: Record<string, string> } {
  const links: SocialLinks = {};
  const errors: Record<string, string> = {};
  for (const p of SOCIAL_PLATFORMS) {
    const out = cleanSocialUrl(p.key, raw[p.key], "clinic");
    if (out.error) errors[`social_${p.key}`] = out.error;
    else if (out.url) links[p.key] = out.url;
  }
  return { links, errors };
}

// The database columns for a clinic's links. A blank answer clears the link.
export const SOCIAL_COLUMNS = { instagram: "social_instagram", facebook: "social_facebook", linkedin: "social_linkedin" } as const;

export function socialRow(links: SocialLinks): Record<string, string | null> {
  return { social_instagram: links.instagram ?? null, social_facebook: links.facebook ?? null, social_linkedin: links.linkedin ?? null };
}

export type SocialColumns = { social_instagram?: string | null; social_facebook?: string | null; social_linkedin?: string | null };

// The links a stored row holds, re-checked on the way out so a bad value in the database can never become a link on a page.
export function socialLinksFrom(row: SocialColumns | null | undefined): { key: SocialKey; name: string; url: string }[] {
  if (!row) return [];
  const out: { key: SocialKey; name: string; url: string }[] = [];
  for (const p of SOCIAL_PLATFORMS) {
    const checked = cleanSocialUrl(p.key, row[SOCIAL_COLUMNS[p.key]], "clinic");
    if (checked.url) out.push({ key: p.key, name: p.name, url: checked.url });
  }
  return out;
}
