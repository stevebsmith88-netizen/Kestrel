"use server";

import { redirect } from "next/navigation";
import { suppress } from "@/lib/suppression";
import { supabaseAdmin } from "@/lib/supabase-server";
import { addressFromUnsubscribe } from "@/lib/unsubscribe-token";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Stops marketing email for a waitlist sign up or an account. The page gives the same
// answer whether or not the code matches anyone, so it cannot be used to check who is
// on our lists.
export async function unsubscribe(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) redirect("/");
  const db = supabaseAdmin();
  if (db) {
    const now = new Date().toISOString();
    const { data: entry } = await db.from("waitlist").update({ unsubscribed_at: now }).eq("id", id).select("email");
    await db.from("profiles").update({ unsubscribed_at: now, marketing_consent: false }).eq("id", id);
    // Also keep the address on the do not email list, so it is honoured everywhere.
    const { data: user } = await db.auth.admin.getUserById(id);
    for (const address of [entry?.[0]?.email, user?.user?.email]) if (address) await suppress(address, "unsubscribed", "unsubscribe link");
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
