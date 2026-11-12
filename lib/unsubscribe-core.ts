import "server-only";
import { suppress } from "@/lib/suppression";
import { supabaseAdmin } from "@/lib/supabase-server";
import { addressFromUnsubscribe } from "@/lib/unsubscribe-token";
import { unsubscribeIdIsGenuine } from "@/lib/unsubscribe-link";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The work behind both unsubscribe pages (lib/unsubscribe.ts) and the one click route (app/api/unsubscribe/route.ts).

// Stops marketing email for a waitlist sign up or an account. Returns false only for an id that is not even the right shape.
export async function unsubscribeById(id: string, signature: string) {
  if (!UUID.test(id)) return false;
  const db = supabaseAdmin();
  if (db) {
    const now = new Date().toISOString();
    // A waitlist id is a random value only we and the person's email have. An account id can be seen by other
    // signed in people, so for an account the link must carry our signature.
    const { data: entry } = await db.from("waitlist").update({ unsubscribed_at: now }).eq("id", id).select("email");
    const addresses = [entry?.[0]?.email];
    if (unsubscribeIdIsGenuine(id, signature)) {
      await db.from("profiles").update({ unsubscribed_at: now, marketing_consent: false }).eq("id", id);
      const { data: user } = await db.auth.admin.getUserById(id);
      addresses.push(user?.user?.email);
    }
    // Also keep the address on the do not email list, so it is honoured everywhere.
    for (const address of addresses) if (address) await suppress(address, "unsubscribed", "unsubscribe link");
  }
  return true;
}

// The unsubscribe for an email address with no account, such as a clinic we wrote to. Only a link we signed works.
export async function unsubscribeByAddress(e: string, s: string) {
  const address = addressFromUnsubscribe(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", e, s);
  if (!address) return false;
  await suppress(address, "unsubscribed", "unsubscribe link");
  return true;
}
