"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { idsFrom } from "@/lib/inbox-select";
import { inboxTarget } from "@/lib/notify-text";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";

// "Mark all as read" in the inbox. Row level security means this can only touch the signed in person's own messages.
export async function markAllRead() {
  await requireRole("candidate", "clinic");
  const db = await supabaseServer();
  if (!db) return;
  await db.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  revalidatePath("/account/inbox");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// "Open" on one message: marks it as read, then goes to the page it points at. If the database cannot be reached the person still gets to the page.
export async function openMessage(formData: FormData) {
  await requireRole("candidate", "clinic");
  const id = String(formData.get("id") ?? "");
  let href: string | null = null;
  const db = UUID.test(id) ? await supabaseServer() : null;
  if (db) {
    const { data } = await db.from("notifications").select("href").eq("id", id).maybeSingle();
    href = (data as { href: string | null } | null)?.href ?? null;
    await db.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
    revalidatePath("/account/inbox");
  }
  redirect(inboxTarget(href));
}

// "Mark as read" on one message that has no page to open.
export async function markOneRead(formData: FormData) {
  await requireRole("candidate", "clinic");
  const id = String(formData.get("id") ?? "");
  const db = UUID.test(id) ? await supabaseServer() : null;
  if (!db) return;
  await db.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
  revalidatePath("/account/inbox");
}

// Several messages at once (Steve, 15th November 2026): the ids come from the ticked boxes (lib/inbox-select.ts).
export async function markSelectedRead(formData: FormData) {
  const session = await requireRole("candidate", "clinic");
  const ids = idsFrom(formData);
  const db = ids.length ? await supabaseServer() : null;
  if (!db) return;
  await db.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids).eq("user_id", session.userId).is("read_at", null);
  revalidatePath("/account/inbox");
}

// Deleting is done with the server key, limited to this person's own messages, so it needs no change to the database.
export async function deleteSelected(formData: FormData) {
  const session = await requireRole("candidate", "clinic");
  const ids = idsFrom(formData);
  const admin = ids.length ? supabaseAdmin() : null;
  if (!admin) return;
  const { error } = await admin.from("notifications").delete().in("id", ids).eq("user_id", session.userId);
  if (error) console.error("Deleting inbox messages failed:", error.code, error.message);
  revalidatePath("/account/inbox");
}
