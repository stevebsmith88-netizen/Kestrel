// Ownership checks for invitations and hand overs (audit P2-05 and P2-06, 27th November 2026). Kept apart from lib/team-server.ts so they can be
// tested with a stand in database.
import type { SupabaseClient } from "@supabase/supabase-js";

// The most locations 1 account can hold. The database refuses more when a location is added (migration 0047, limit_locations); this is for
// a hand over, which the database rule does not see.
export const LOCATION_MAX = 25;
export const LOCATION_MAX_TEXT = "That person already holds 25 locations on Kestrel, which is the most an account can have. Please email support@eyecarejobs.ca.";

// The locations in `others` owned by the person who owns `main` today. An invitation can cover several of the owner's locations; if 1 of them
// has been handed to someone else since it was sent, it is left out, so nobody joins a team on a former owner's say so (P2-05).
export async function stillSameOwner(db: SupabaseClient, main: string, others: readonly string[]): Promise<string[]> {
  if (!others.length) return [];
  const { data: mainRow } = await db.from("employers").select("owner_id").eq("id", main).maybeSingle();
  const owner = (mainRow as { owner_id?: string | null } | null)?.owner_id;
  if (!owner) return [];
  const { data } = await db.from("employers").select("id").in("id", [...others]).eq("owner_id", owner);
  const owned = new Set(((data ?? []) as { id: string }[]).map((r) => r.id));
  return others.filter((id) => owned.has(id));
}

// Whether handing a location to this person would take them past the limit (P2-06).
export async function atLocationLimit(db: SupabaseClient, userId: string): Promise<boolean> {
  const { count } = await db.from("employers").select("id", { count: "exact", head: true }).eq("owner_id", userId);
  return (count ?? 0) >= LOCATION_MAX;
}
