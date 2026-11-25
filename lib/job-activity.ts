import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// The notes log for each job (migration 0049): what happened and when, for Kestrel's admin to read in a drop down under the job.
// Best effort, like the inbox: a problem here (or a database without the table yet) is logged and never stops the thing that caused it.
// Never put a card number, a Stripe key or a resume in a note.

export type ActivityActor = "system" | "admin" | "clinic";
export type ActivityRow = { job_id: string; actor: ActivityActor; text: string; detail: string | null; created_at: string };

export async function logJobActivity(db: SupabaseClient, jobId: string, text: string, options: { actor?: ActivityActor; detail?: string } = {}): Promise<void> {
  try {
    const { error } = await db.from("job_activity").insert({ job_id: jobId, actor: options.actor ?? "system", text: text.slice(0, 300), detail: options.detail ? options.detail.slice(0, 500) : null });
    if (error && error.code !== "42P01" && error.code !== "PGRST205") console.error("Job note not saved:", error.code, error.message);
  } catch (e) {
    console.error("Job note not saved:", e instanceof Error ? e.message : e);
  }
}

// The notes for several jobs at once, oldest first. A database without the table gives an empty list for each job.
export async function loadActivity(db: SupabaseClient, jobIds: string[]): Promise<Map<string, ActivityRow[]>> {
  const out = new Map<string, ActivityRow[]>();
  if (!jobIds.length) return out;
  try {
    const { data } = await db.from("job_activity").select("job_id, actor, text, detail, created_at").in("job_id", jobIds).order("created_at", { ascending: true });
    for (const row of (data ?? []) as ActivityRow[]) out.set(row.job_id, [...(out.get(row.job_id) ?? []), row]);
  } catch {
    // no table yet
  }
  return out;
}
