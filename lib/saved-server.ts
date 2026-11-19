import "server-only";
import type { Session } from "@/lib/auth";
import { ALERT_PAY_COLUMNS } from "@/lib/job-alert-text";
import { payChips, type PayFields } from "@/lib/job-pay";
import { withExpected } from "@/lib/expected-columns";
import { SAVE_LIMIT, SAVE_LIMIT_TEXT, openness, sortSaved, type SaveState } from "@/lib/saved-jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isJobId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export async function savedState(session: Session | null, jobId: string): Promise<SaveState> {
  if (!session) return "signed-out";
  if (session.role !== "candidate") return "hidden";
  const admin = supabaseAdmin();
  if (!admin) return "not-saved";
  const { data } = await admin.from("saved_jobs").select("job_id").eq("user_id", session.userId).eq("job_id", jobId).maybeSingle();
  return data ? "saved" : "not-saved";
}

// Which of these jobs the signed in candidate has saved, for the search page. Empty for anyone else, and before the SQL is run.
export async function savedAmong(session: Session | null, jobIds: string[]): Promise<Set<string>> {
  if (!session || session.role !== "candidate" || !jobIds.length) return new Set();
  const admin = supabaseAdmin();
  if (!admin) return new Set();
  const { data, error } = await admin.from("saved_jobs").select("job_id").eq("user_id", session.userId).in("job_id", jobIds);
  return error ? new Set() : new Set((data ?? []).map((r) => r.job_id as string));
}

// Saves or removes. Only a job that is live can be saved, so nobody can use this to find out about a draft or a job in review.
export async function setSaved(session: Session, jobId: string, save: boolean): Promise<{ state: SaveState; error?: string }> {
  if (session.role !== "candidate") return { state: "hidden", error: "Only candidates can save jobs." };
  const admin = supabaseAdmin();
  if (!admin) return { state: "not-saved", error: "We couldn't save that just now. Please try again." };
  if (!save) {
    await admin.from("saved_jobs").delete().eq("user_id", session.userId).eq("job_id", jobId);
    return { state: "not-saved" };
  }
  const { data: job } = await admin.from("jobs").select("id").eq("id", jobId).eq("status", "live").gt("expires_at", new Date().toISOString()).maybeSingle();
  if (!job) return { state: "not-saved", error: "That job is no longer open." };
  const { count } = await admin.from("saved_jobs").select("job_id", { count: "exact", head: true }).eq("user_id", session.userId);
  if ((count ?? 0) >= SAVE_LIMIT) return { state: "not-saved", error: SAVE_LIMIT_TEXT };
  const { error } = await admin.from("saved_jobs").upsert({ user_id: session.userId, job_id: jobId }, { onConflict: "user_id,job_id", ignoreDuplicates: true });
  if (error) {
    console.error("Saved job not kept:", error.code, error.message);
    return { state: "not-saved", error: "We couldn't save that just now. Please try again." };
  }
  return { state: "saved" };
}

export type SavedJob = { id: string; title: string; clinic: string; place: string; chips: string[]; saved_at: string; expires_at: string | null; open: boolean; why: string; applied: boolean; external: boolean };

// The signed in candidate's saved jobs, open ones first. Read with the server key, because a job that has closed is hidden from the
// candidate's own sign in, and only public facts about the job are returned.
export async function listSaved(userId: string): Promise<SavedJob[]> {
  const admin = supabaseAdmin();
  if (!admin) return [];
  const { data: saved } = await admin.from("saved_jobs").select("job_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(SAVE_LIMIT);
  if (!saved?.length) return [];
  const ids = saved.map((s) => s.job_id as string);
  const [{ data: jobs }, { data: applied }] = await Promise.all([
    admin.from("jobs").select(await withExpected(`id, title, city, province, status, expires_at, apply_method, ${ALERT_PAY_COLUMNS}, employers(clinic_name)`)).in("id", ids),
    admin.from("applications").select("job_id").eq("candidate_id", userId).in("job_id", ids),
  ]);
  const appliedIds = new Set((applied ?? []).map((a) => a.job_id as string));
  const byId = new Map(((jobs ?? []) as unknown as (PayFields & { id: string; title: string; city: string; province: string; status: string; expires_at: string | null; apply_method: string | null; employers: { clinic_name: string } | null })[]).map((j) => [j.id, j]));
  const rows = saved.map((s) => {
    const j = byId.get(s.job_id as string);
    const o = openness(j ?? null);
    return {
      id: s.job_id as string,
      title: j?.title ?? "A job that has been removed",
      clinic: j?.employers?.clinic_name ?? "",
      place: j ? `${j.city}, ${j.province}` : "",
      chips: j ? payChips(j) : [],
      saved_at: s.created_at as string,
      expires_at: j?.expires_at ?? null,
      open: o.open,
      why: o.text,
      applied: appliedIds.has(s.job_id as string),
      external: j?.apply_method === "external",
    };
  });
  return sortSaved(rows);
}
