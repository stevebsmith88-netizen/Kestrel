"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { isSuppressed } from "@/lib/suppression";
import { supabaseAdmin } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Steve ticks clinics from the leads list and starts the sequence for them. This is his approval of the batch.
// Only a lead with a published address and the page it came from can be added. The first email is due straight away,
// but nothing is sent unless outreach is switched on.
export async function addToOutreach(form: FormData) {
  const session = await requireRole("admin");
  const ids = form.getAll("leadIds").map(String).filter((x) => UUID.test(x)).slice(0, 50);
  const db = supabaseAdmin();
  if (!db || ids.length === 0) redirect("/admin/outreach?notice=none-ticked");
  const { data: leads } = await db.from("clinic_leads").select("id, clinic_name, contact_email, email_source_url, email_found_at").in("id", ids).not("contact_email", "is", null);
  const now = new Date().toISOString();
  let added = 0;
  for (const lead of leads ?? []) {
    const email = String(lead.contact_email).trim().toLowerCase();
    if (!lead.email_source_url || !lead.email_found_at || (await isSuppressed(email))) continue;
    const { data } = await db
      .from("outreach_contacts")
      .upsert(
        { lead_id: lead.id, email, clinic_name: lead.clinic_name, email_source_url: lead.email_source_url, email_found_at: lead.email_found_at, next_due_at: now, approved_by: session.userId, approved_at: now },
        { onConflict: "email", ignoreDuplicates: true },
      )
      .select("id");
    added += data?.length ?? 0;
  }
  revalidatePath("/admin/outreach");
  redirect(`/admin/outreach?notice=added&count=${added}`);
}

// Stop the sequence for one clinic, for example because they replied. They can be emailed by a person after that.
export async function stopOutreach(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id") ?? "");
  const reason = String(form.get("reason") ?? "") === "replied" ? "replied" : "manual";
  const db = supabaseAdmin();
  if (UUID.test(id) && db) {
    await db.from("outreach_contacts").update({ status: "stopped", stop_reason: reason, next_due_at: null, updated_at: new Date().toISOString() }).eq("id", id).eq("status", "active");
  }
  revalidatePath("/admin/outreach");
  redirect("/admin/outreach?notice=stopped");
}
