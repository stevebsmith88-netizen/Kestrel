// The unsubscribe headers on a marketing email (audit P1-51). Gmail and Yahoo ask for the one click form (RFC 8058): the
// List-Unsubscribe address takes a POST, and List-Unsubscribe-Post says so. The email's own footer link still opens the page
// with a button. Kept free of app imports so it can be tested on its own (lib/unsubscribe-headers.test.ts).

// Turns the page link (/unsubscribe/<id>?s= or /unsubscribe/address?e=&s=) into the one click route (/api/unsubscribe).
export function oneClickUrl(pageUrl: string, site: string): string | null {
  let url: URL;
  try {
    url = new URL(pageUrl);
  } catch {
    return null;
  }
  if (url.origin !== new URL(site).origin) return null;
  const s = url.searchParams.get("s");
  if (!s) return null;
  const out = new URL("/api/unsubscribe", site);
  if (url.pathname === "/unsubscribe/address") {
    const e = url.searchParams.get("e");
    if (!e) return null;
    out.search = `e=${encodeURIComponent(e)}&s=${encodeURIComponent(s)}`;
    return out.toString();
  }
  const match = url.pathname.match(/^\/unsubscribe\/([0-9a-f-]{36})$/i);
  if (!match) return null;
  out.search = `id=${match[1]}&s=${encodeURIComponent(s)}`;
  return out.toString();
}

export function unsubscribeHeaders(pageUrl: string, site: string): Record<string, string> {
  const oneClick = oneClickUrl(pageUrl, site);
  return oneClick ? { "List-Unsubscribe": `<${oneClick}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : { "List-Unsubscribe": `<${pageUrl}>` };
}
