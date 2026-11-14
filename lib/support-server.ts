import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { accessOpen } from "@/lib/support";

// The open help request that lets Kestrel into a clinic's account, if there is one (migration 0046). On a database without the table, none.
export async function clinicAccess(admin: SupabaseClient, employerId: string) {
  const { data, error } = await admin.from("support_requests").select("id, reason, message, access_until, status, created_at").eq("employer_id", employerId).eq("kind", "help").eq("status", "open").not("access_until", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return null;
  return accessOpen(data) ? data : null;
}
