import "server-only";
import { demoMode } from "@/lib/demo";
import { INDEXNOW_ENDPOINT, indexNowPayload, validKey } from "@/lib/indexnow-rules";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

// The key is public by design, since the search engine reads it from the key file on the site. It is a setting so the demo site, which must
// never ask search engines to look at it, simply has none. See docs/marketing/search-engines.md.
export const indexNowKey = () => (process.env.INDEXNOW_KEY ?? "").trim();

export type IndexNowResult = { ok: boolean; sent: number; note: string };

// Tells search engines these pages were added, changed or removed. Never throws: a failed ping must not break the page or the daily job.
export async function submitToIndexNow(urls: string[]): Promise<IndexNowResult> {
  if (demoMode()) return { ok: false, sent: 0, note: "This is the demo site, which never contacts search engines." };
  const key = indexNowKey();
  if (!validKey(key)) return { ok: false, sent: 0, note: "INDEXNOW_KEY is not set, so nothing was sent." };
  const payload = indexNowPayload(SITE, key, urls);
  if (payload.urlList.length === 0) return { ok: true, sent: 0, note: "No pages to send." };
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(payload) });
    // 200 and 202 both mean it was received.
    if (res.status === 200 || res.status === 202) return { ok: true, sent: payload.urlList.length, note: "Sent." };
    return { ok: false, sent: 0, note: `IndexNow answered ${res.status}.` };
  } catch (error) {
    return { ok: false, sent: 0, note: error instanceof Error ? error.message : "IndexNow could not be reached." };
  }
}
