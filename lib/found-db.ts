import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hostOfUrl, siteKey } from "@/lib/page-reader";

// Every clinic profile with the same website. A found listing or a lead is never added for a clinic that has its own account.
// Kept out of the actions files, because anything exported from them can be called from a browser.
export async function clinicsAtSite(db: SupabaseClient, website: string) {
  const key = siteKey(hostOfUrl(website));
  if (!key) return [];
  const { data } = await db.from("employers").select("id, clinic_name, claimed, owner_id, website").ilike("website", `%${key.replace(/[%_\\]/g, "\\$&")}%`).limit(50);
  return (data ?? []).filter((e) => siteKey(hostOfUrl(e.website ?? "")) === key);
}

export const ALREADY_ON_KESTREL = "This clinic already has its own Kestrel account, so it posts its own jobs. Found listings are only for clinics that are not on Kestrel yet.";
