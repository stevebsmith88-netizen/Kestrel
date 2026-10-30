"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";

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
    await db.from("waitlist").update({ unsubscribed_at: now }).eq("id", id);
    await db.from("profiles").update({ unsubscribed_at: now, marketing_consent: false }).eq("id", id);
  }
  redirect(`/unsubscribe/${id}?done=1`);
}
