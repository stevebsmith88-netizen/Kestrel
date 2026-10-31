"use server";

import { redirect } from "next/navigation";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import { unsubscribeIdUrl } from "@/lib/unsubscribe-link";
import { valueIsGenuine } from "@/lib/unsubscribe-token";
import { WAITLIST_PURPOSE } from "@/lib/waitlist-confirm";
import { supabaseAdmin } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The button on the confirmation page. Pressing it, not just opening the link, confirms the
// address, so an email scanner that opens links cannot confirm it by accident.
export async function confirmWaitlist(form: FormData) {
  const id = String(form.get("id") ?? "");
  const s = String(form.get("s") ?? "");
  const db = supabaseAdmin();
  if (!UUID.test(id) || !db || !valueIsGenuine(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", WAITLIST_PURPOSE, id, s)) redirect("/waitlist/confirm?problem=1");

  const { data: row } = await db.from("waitlist").select("id, email, first_name, confirmed_at, unsubscribed_at").eq("id", id).maybeSingle();
  if (!row) redirect("/waitlist/confirm?problem=1");
  if (row.unsubscribed_at) redirect("/waitlist/confirm?unsubscribed=1");
  if (row.confirmed_at) redirect("/waitlist/confirm?done=1");

  await db.from("waitlist").update({ confirmed_at: new Date().toISOString() }).eq("id", id).is("confirmed_at", null);
  // They asked to join again and have proved the address is theirs, so an earlier "unsubscribe" is lifted.
  // Complaints, bounces and addresses we were asked to block by hand stay blocked.
  await db.from("email_suppressions").delete().eq("address", row.email).eq("reason", "unsubscribed");

  const unsubscribeUrl = unsubscribeIdUrl(row.id);
  const mail = emailLayout({
    heading: "You're on the list",
    paragraphs: [
      `Thanks, ${row.first_name}. Your address is confirmed and you are on the Kestrel Eye Care Jobs waitlist.`,
      "We are building a job board for eye care across Canada, with the pay shown on every job. We will email you the moment Kestrel opens.",
    ],
    buttonText: "Visit Kestrel",
    buttonUrl: SITE_URL,
    unsubscribeUrl,
  });
  await sendEmail({ to: row.email, subject: "You're on the Kestrel waitlist", unsubscribeUrl, ...mail });
  redirect("/waitlist/confirm?done=1");
}
