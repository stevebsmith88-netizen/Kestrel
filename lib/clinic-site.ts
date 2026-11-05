import "server-only";
import { fetchPage } from "@/lib/fetch-page";
import { mentionsEyeRecommend, refuseAddress } from "@/lib/page-reader";

// Plain text from a clinic's own website (its home page, and an about or team page if there is one), for the ad builder to find
// specifics in. Reads at most 3 pages, obeys robots.txt, refuses private addresses, and gives up quietly if anything is slow or
// refused, so the ad is simply written without it. Nothing is stored.
const ABOUT_PATHS = ["/about", "/about-us", "/our-team", "/our-practice"];

const within = <T,>(promise: Promise<T>, ms: number) => Promise.race<T | null>([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

export async function clinicSiteText(website: string | null | undefined): Promise<string> {
  let origin = "";
  try {
    origin = new URL(String(website ?? "")).origin;
  } catch {
    return "";
  }
  if (refuseAddress(origin)) return "";
  const home = await within(fetchPage(origin), 10_000);
  if (!home || !home.ok) return "";
  const pages = [home.page];
  for (const path of ABOUT_PATHS.slice(0, 2)) {
    const about = await within(fetchPage(`${origin}${path}`), 6_000);
    if (about && about.ok && new URL(about.url).pathname !== "/") {
      pages.push(about.page);
      break;
    }
  }
  const all = pages.map((p) => `${p.title}\n${p.text}`).join("\n\n");
  // A site that mentions Eye Recommend is never used (CLAUDE.md, Non negotiables).
  if (mentionsEyeRecommend(all) || pages.some((p) => p.links.some((l) => mentionsEyeRecommend(l.url)))) return "";
  return all;
}
