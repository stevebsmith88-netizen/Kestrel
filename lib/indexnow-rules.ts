// IndexNow tells Bing (and other search engines that support it) the moment a page is added, changed or removed, so a new site does not have
// to wait for a crawl to find them. Kept free of imports from the app so the rules can be tested on their own (lib/indexnow-rules.test.ts).
// Bing's guidelines recommend it, and the key is public by design: the key file on the site is how the search engine checks the request is ours.

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const INDEXNOW_MAX_URLS = 10000;

export const validKey = (key: string) => /^[a-zA-Z0-9-]{8,128}$/.test(key);

// Only our own pages, once each, and no more than IndexNow accepts in one request.
export function indexNowUrls(site: string, urls: string[]): string[] {
  const host = new URL(site).host;
  const clean = new Set<string>();
  for (const u of urls) {
    try {
      const parsed = new URL(u);
      if (parsed.host === host && parsed.protocol === "https:") clean.add(parsed.toString());
    } catch {
      // Not an address, so not sent.
    }
  }
  return [...clean].slice(0, INDEXNOW_MAX_URLS);
}

export function indexNowPayload(site: string, key: string, urls: string[]) {
  const url = new URL(site);
  return { host: url.host, key, keyLocation: `${url.origin}/indexnow-key.txt`, urlList: indexNowUrls(site, urls) };
}
