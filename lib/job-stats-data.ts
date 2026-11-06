import "server-only";
import { getSession } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";
import { summariseStats, type EventKind, type JobNumbers, type StatRow } from "@/lib/job-stats";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Adds 1 to a job's count for today. The database ignores it unless the job is live.
export async function recordJobEvent(jobId: string, kind: EventKind) {
  const db = supabaseAdmin();
  if (!db) return;
  const { error } = await db.rpc("record_job_event", { p_job_id: jobId, p_kind: kind });
  if (error) console.error("Job count failed:", error.code, error.message);
}

// Our own team and the clinic that posted a job looking at it should not count as candidates looking.
export async function isOwnerOrAdmin(jobId: string) {
  const session = await getSession();
  if (!session) return false;
  if (session.role === "admin") return true;
  if (session.role !== "clinic") return false;
  const [employer, db] = [await getMyEmployer(session.userId), supabaseAdmin()];
  if (!employer || !db) return false;
  const { data } = await db.from("jobs").select("employer_id").eq("id", jobId).maybeSingle();
  return data?.employer_id === employer.id;
}

// The signed in clinic's own numbers (row level security means only their own jobs come back).
export async function getMyJobNumbers(): Promise<Record<string, JobNumbers>> {
  const db = await supabaseServer();
  if (!db) return {};
  const { data, error } = await db.from("job_daily_stats").select("job_id, day, views, apply_clicks");
  if (error) {
    console.error("Job numbers failed:", error.code, error.message);
    return {};
  }
  return summariseStats((data ?? []) as StatRow[]);
}
