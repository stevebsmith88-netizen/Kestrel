"use server";

import { redirect } from "next/navigation";
import sitemap from "@/app/sitemap";
import { requireRole } from "@/lib/auth";
import { submitToIndexNow } from "@/lib/indexnow";

// The button on the admin overview: tells search engines about every page in the sitemap at once. Used once after setting the key, and again
// after big changes. Day to day, the daily job sends only what changed.
export async function notifySearchEnginesAll() {
  await requireRole("admin");
  const result = await submitToIndexNow((await sitemap()).map((entry) => entry.url));
  redirect(`/admin?indexnow=${result.ok ? "sent" : "failed"}&n=${result.sent}&why=${encodeURIComponent(result.ok ? "" : result.note.slice(0, 120))}`);
}
