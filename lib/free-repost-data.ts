import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { freeRepostStillApplies, freeRepostVerdict, type FreeRepostJob, type FreeRepostVerdict } from "@/lib/free-repost";
import { supabaseAdmin } from "@/lib/supabase-server";

// The server side of the free second chance (lib/free-repost.ts). Everything here reads with the server key and tolerates a database that has not
// had migration 0061 yet: the question fails, so nothing is offered and nothing is free.
const COLUMNS = "id, status, posted_at, filled_via, filled_application_id, is_seeded, free_repost_of, role_category";
type Row = FreeRepostJob & { id: string; role_category: string | null };

// The ids of a clinic location's jobs that can be posted again free right now.
export async function loadFreeRepostEligible(employerId: string, now = new Date()): Promise<Set<string>> {
  const db = supabaseAdmin();
  const out = new Set<string>();
  if (!db) return out;
  const { data, error } = await db.from("jobs").select(COLUMNS).eq("employer_id", employerId).limit(500);
  if (error || !data) return out;
  const rows = data as unknown as Row[];
  const used = new Set(rows.map((r) => r.free_repost_of).filter((x): x is string => Boolean(x)));
  for (const r of rows) if (freeRepostVerdict(r, used.has(r.id), now).ok) out.add(r.id);
  return out;
}

// One job, for the button that makes the free copy. Another location's job is never offered.
export async function freeRepostOffer(db: SupabaseClient, jobId: string, employerId: string, now = new Date()): Promise<FreeRepostVerdict | { ok: false; why: "not-found" }> {
  const { data, error } = await db.from("jobs").select(COLUMNS).eq("id", jobId).eq("employer_id", employerId).maybeSingle();
  if (error || !data) return { ok: false, why: "not-found" };
  const { count } = await db.from("jobs").select("id", { count: "exact", head: true }).eq("free_repost_of", jobId);
  return freeRepostVerdict(data as unknown as Row, (count ?? 0) > 0, now);
}

// At submit: is this job a free second chance, and is it still for the same role as the job it came from?
export async function isFreeSecondChance(db: SupabaseClient, jobId: string, role: string | null): Promise<boolean> {
  const { data } = await db.from("jobs").select("free_repost_of").eq("id", jobId).maybeSingle();
  const of = (data as { free_repost_of: string | null } | null)?.free_repost_of;
  if (!of) return false;
  const { data: original } = await db.from("jobs").select("role_category").eq("id", of).maybeSingle();
  return freeRepostStillApplies(role, (original as { role_category: string | null } | null)?.role_category);
}
