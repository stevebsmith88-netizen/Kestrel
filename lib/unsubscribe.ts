"use server";

import { redirect } from "next/navigation";
import { suppress } from "@/lib/suppression";
import { supabaseAdmin } from "@/lib/supabase-server";
import { addressFromUnsubscribe } from "@/lib/unsubscribe-token";
import { unsubscribeIdIsGenuine } from "@/lib/unsubscribe-link";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Stops marketing email for a waitlist sign up or an account. The page gives the same
// answer whether or not the code matches anyone, so it cannot be used to check who is
// on our lists.
export async function unsubscribe(form: FormData) {
  const id = String(form.get("id") ?? "");
  const signature = String(form.get("s") ?? "");
  if (!UUID.test(id)) redirect("/");
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
  redirect(`/unsubscribe/${id}?done=1`);
}

// The unsubscribe for an email address with no account, such as a clinic we wrote to. The link
// carries a signature, so only a link we sent can unsubscribe an address.
export async function unsubscribeAddress(form: FormData) {
  const e = String(form.get("e") ?? "");
  const s = String(form.get("s") ?? "");
  const address = addressFromUnsubscribe(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", e, s);
  if (!address) redirect("/unsubscribe/address?problem=1");
  await suppress(address, "unsubscribed", "unsubscribe link");
  redirect("/unsubscribe/address?done=1");
}
