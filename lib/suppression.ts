import "server-only";
import { normaliseAddress, suppressionKeys, unsubscribeQuery } from "@/lib/unsubscribe-token";
import { supabaseAdmin } from "@/lib/supabase-server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

// Links are signed with a key only the server holds, so they cannot be forged.
const secret = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export type SuppressionReason = "unsubscribed" | "asked_to_stop" | "bounced" | "complaint" | "admin";

// The unsubscribe link for an email to someone who has no Kestrel account or waitlist entry,
// such as a clinic we write to about a listing.
export function addressUnsubscribeUrl(address: string) {
  return `${SITE}/unsubscribe/address?${unsubscribeQuery(secret(), address)}`;
}

// Is this address, or its whole domain, on the do not email list? If the list cannot be read,
// the answer is yes. Not sending is safer than sending to someone who asked us to stop.
export async function isSuppressed(address: string) {
  const db = supabaseAdmin();
  if (!db) return false;
  const { data, error } = await db.from("email_suppressions").select("id").in("address", suppressionKeys(address)).limit(1);
  if (error) {
    console.error("Do not email check failed:", error.code, error.message);
    return true;
  }
  return (data?.length ?? 0) > 0;
}

// Adds an address (or a whole domain, written @clinic.ca). Adding it twice does no harm.
export async function suppress(address: string, reason: SuppressionReason, source?: string) {
  const db = supabaseAdmin();
  const clean = normaliseAddress(address);
  if (!db || !clean) return false;
  const { error } = await db.from("email_suppressions").upsert({ address: clean, reason, source: source?.slice(0, 200) ?? null }, { onConflict: "address", ignoreDuplicates: true });
  if (error) console.error("Adding to the do not email list failed:", error.code, error.message);
  return !error;
}
