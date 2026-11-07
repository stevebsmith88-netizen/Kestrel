"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { submitToIndexNow, type IndexNowResult } from "@/lib/indexnow";
import { sitemapEntries } from "@/lib/sitemap-entries";

// The button on the admin overview: tells search engines about every page in the sitemap at once. Used once after setting the key, and again
// after big changes. Day to day, the daily job sends only what changed. Any failure comes back as a message on the admin page, never as a
// blank error page.
export async function notifySearchEnginesAll() {
  await requireRole("admin");
  let result: IndexNowResult;
  try {
    result = await submitToIndexNow((await sitemapEntries()).map((entry) => entry.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Telling search engines failed:", message);
    result = { ok: false, sent: 0, note: `Something went wrong: ${message}` };
  }
  redirect(`/admin?indexnow=${result.ok ? "sent" : "failed"}&n=${result.sent}&why=${encodeURIComponent(result.ok ? "" : result.note.slice(0, 160))}`);
}
