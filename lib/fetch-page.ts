import "server-only";
import { lookup } from "node:dns/promises";
import { READER_USER_AGENT, isPrivateAddress, readHtml, refuseAddress, robotsAllows, type ReadPage } from "@/lib/page-reader";

// Fetches one public web page that a person asked for, politely and safely:
//  * only public websites (never a private or internal address, checked again after every redirect),
//  * the site's robots.txt is obeyed,
//  * it says who it is (READER_USER_AGENT), waits no more than 12 seconds, and reads no more than 3 MB,
//  * nothing is stored here. The caller decides what to keep.

const PAGE_TIMEOUT = 12_000;
const ROBOTS_TIMEOUT = 6_000;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 4;

export type FetchResult = { ok: true; url: string; page: ReadPage } | { ok: false; reason: string };

async function publicHost(url: URL): Promise<string | null> {
  const refused = refuseAddress(url.toString());
  if (refused) return refused;
  try {
    const addresses = await lookup(url.hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((a) => isPrivateAddress(a.address))) return "That is not a public website.";
  } catch {
    return "We couldn't find that website. Check the web address and try again.";
  }
  return null;
}

async function readBody(response: Response, limit: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(Math.min(size, limit));
  let at = 0;
  for (const c of chunks) {
    bytes.set(c.subarray(0, bytes.length - at), at);
    at += c.byteLength;
    if (at >= bytes.length) break;
  }
  const charset = /charset=([\w-]+)/i.exec(response.headers.get("content-type") ?? "")?.[1]?.toLowerCase() ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

// RFC 9309: no robots.txt (a 4xx answer) means everything may be read. A server error or no answer at all means nothing may.
// `cache` holds each site's robots.txt for the length of one read (null when it could not be fetched).
async function robotsPermit(url: URL, cache: Map<string, string | null>): Promise<boolean> {
  if (!cache.has(url.origin)) {
    let text: string | null = null;
    try {
      const res = await fetch(`${url.origin}/robots.txt`, {
        headers: { "user-agent": READER_USER_AGENT, accept: "text/plain" },
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(ROBOTS_TIMEOUT),
      });
      if (res.status >= 400 && res.status < 500) {
        await res.body?.cancel();
        text = "";
      } else if (res.ok) {
        text = await readBody(res, 500 * 1024);
      } else {
        await res.body?.cancel();
      }
    } catch {
      text = null;
    }
    cache.set(url.origin, text);
  }
  const text = cache.get(url.origin);
  return typeof text === "string" && robotsAllows(text, `${url.pathname}${url.search}`);
}

export async function fetchPage(address: string): Promise<FetchResult> {
  let url: URL;
  try {
    url = new URL(address);
  } catch {
    return { ok: false, reason: "Enter the full web address of the careers page, starting with https://." };
  }
  const robots = new Map<string, string | null>();
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const refused = await publicHost(url);
    if (refused) return { ok: false, reason: refused };
    if (!(await robotsPermit(url, robots))) {
      return { ok: false, reason: "This website asks automated readers to stay away from this page (in its robots.txt file), so Kestrel does not read it." };
    }
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "user-agent": READER_USER_AGENT, accept: "text/html,application/xhtml+xml;q=0.9,text/plain;q=0.5", "accept-language": "en-CA,en;q=0.9,fr-CA;q=0.5" },
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(PAGE_TIMEOUT),
      });
    } catch (error) {
      const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      return { ok: false, reason: timedOut ? "The website took too long to answer. Try again in a few minutes." : "We couldn't reach that website. Check the web address and try again." };
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) return { ok: false, reason: "The website sent us somewhere without saying where. Open the page in your browser and copy its address." };
      url = new URL(location, url);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      return { ok: false, reason: response.status === 404 || response.status === 410 ? "That page is not there any more. The job may have been filled." : `The website answered with an error (${response.status}). Try again later.` };
    }
    const type = response.headers.get("content-type") ?? "";
    if (!/html|text\/plain/i.test(type)) {
      await response.body?.cancel();
      return { ok: false, reason: /pdf/i.test(type) ? "That link is a PDF. Use the web page that lists the job instead." : "That link is not a web page." };
    }
    const html = await readBody(response, MAX_BYTES);
    return { ok: true, url: url.toString(), page: readHtml(html, url.toString()) };
  }
  return { ok: false, reason: "The website redirected us too many times. Open the page in your browser and copy its address." };
}
