import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotifyMessage } from "@/lib/notify-text";
import { supabaseServer } from "@/lib/supabase/server";

export type Notification = { id: string; kind: string; title: string; body: string | null; href: string | null; read_at: string | null; created_at: string };

// Adds a message to someone's inbox. Always best effort: a problem here (or a database that has not had migration 0038 yet) is logged and never
// stops the thing that caused it, such as an application moving to a new step. Only the website's server calls this.
export async function notify(admin: SupabaseClient, userId: string | null | undefined, message: NotifyMessage | null) {
  if (!userId || !message) return;
  try {
    const { error } = await admin.from("notifications").insert({
      user_id: userId,
      kind: message.kind,
      title: message.title.slice(0, 160),
      body: message.body ? message.body.slice(0, 500) : null,
      href: message.href && message.href.startsWith("/") ? message.href.slice(0, 200) : null,
    });
    if (error) console.error("Notification not saved:", error.code, error.message);
  } catch (e) {
    console.error("Notification not saved:", e instanceof Error ? e.message : e);
  }
}

// The signed in person's own inbox, newest first. Row level security means only their own rows come back.
export async function getMyNotifications(limit = 50): Promise<Notification[]> {
  const db = await supabaseServer();
  if (!db) return [];
  const { data, error } = await db.from("notifications").select("id, kind, title, body, href, read_at, created_at").order("created_at", { ascending: false }).limit(limit);
  if (error) return [];
  return (data ?? []) as Notification[];
}

// How many are unread, for the number beside the envelope in the top bar. 0 if the table is not there yet.
export async function unreadCount(): Promise<number> {
  const db = await supabaseServer();
  if (!db) return 0;
  const { count, error } = await db.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  return error ? 0 : (count ?? 0);
}
