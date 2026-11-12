"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { inboxTarget } from "@/lib/notify-text";
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
