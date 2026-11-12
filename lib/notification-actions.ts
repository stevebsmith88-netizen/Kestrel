"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

// "Mark all as read" in the inbox. Row level security means this can only touch the signed in person's own messages.
export async function markAllRead() {
  await requireRole("candidate", "clinic");
  const db = await supabaseServer();
  if (!db) return;
  await db.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  revalidatePath("/account/inbox");
}
