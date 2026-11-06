// Where a visitor came from, saved with a waitlist sign up so Steve can see which links and pages bring people in.
// Only the first visit of a browser session is remembered (in sessionStorage, which the browser clears when the tab
// closes). Nothing is sent anywhere until the person presses the join button, and nothing identifies them.
// Link naming rules are in docs/utm-guide.md.

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_host: string | null;
  landing_path: string | null;
};

export const ATTRIBUTION_KEY = "kestrel_first_touch";

export const EMPTY_ATTRIBUTION: Attribution = { utm_source: null, utm_medium: null, utm_campaign: null, referrer_host: null, landing_path: null };

// Link tags are lower case words, numbers, dots, hyphens and underscores, at most 60 characters.
export function cleanTag(value: unknown, max = 60): string | null {
  if (typeof value !== "string") return null;
  const tag = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "").slice(0, max);
  return tag || null;
}

export function cleanHost(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const host = value.trim().toLowerCase().replace(/^www\./, "").replace(/[^a-z0-9.-]/g, "").slice(0, 100);
  return host.includes(".") ? host : null;
}

// The page path only, never the query string, so nothing personal can ride along in a link.
export function cleanPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.split(/[?#]/)[0].trim().replace(/[^A-Za-z0-9/_.\-]/g, "").slice(0, 120);
  return path.startsWith("/") ? path : null;
}

export function readAttribution(input: { search: string; referrer: string; siteHost: string; path: string }): Attribution {
  const params = new URLSearchParams(input.search);
  let referrerHost: string | null = null;
  try {
    referrerHost = input.referrer ? cleanHost(new URL(input.referrer).hostname) : null;
  } catch {
    referrerHost = null;
  }
  // A visit from another page on this site is not a source.
  if (referrerHost && referrerHost === cleanHost(input.siteHost)) referrerHost = null;
  return {
    utm_source: cleanTag(params.get("utm_source")),
    utm_medium: cleanTag(params.get("utm_medium")),
    utm_campaign: cleanTag(params.get("utm_campaign")),
    referrer_host: referrerHost,
    landing_path: cleanPath(input.path),
  };
}

// Used on the server for anything the browser sends, which is never trusted as it arrives.
export function cleanAttribution(raw: unknown): Attribution {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    utm_source: cleanTag(r.utm_source),
    utm_medium: cleanTag(r.utm_medium),
    utm_campaign: cleanTag(r.utm_campaign),
    referrer_host: cleanHost(r.referrer_host),
    landing_path: cleanPath(r.landing_path),
  };
}

// A short plain label for the admin pages.
export function sourceLabel(a: Partial<Attribution>): string {
  if (a.utm_source) return a.utm_medium ? `${a.utm_source} (${a.utm_medium})` : a.utm_source;
  if (a.referrer_host) return a.referrer_host;
  if (a.landing_path) return "Direct";
  return "Not recorded";
}

export function saveFirstTouch(): void {
  try {
    if (window.sessionStorage.getItem(ATTRIBUTION_KEY)) return;
    const a = readAttribution({ search: window.location.search, referrer: document.referrer, siteHost: window.location.hostname, path: window.location.pathname });
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(a));
  } catch {
    // Storage can be switched off. The sign up still works without a source.
  }
}

export function storedFirstTouch(): Attribution {
  try {
    return cleanAttribution(JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) ?? "null"));
  } catch {
    return EMPTY_ATTRIBUTION;
  }
}
