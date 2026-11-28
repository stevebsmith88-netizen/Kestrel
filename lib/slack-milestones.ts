import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notifySlack } from "@/lib/notify-slack";
import { reachedKeys, toAnnounce, type MilestoneCounts } from "@/lib/milestones";
import { countRows } from "@/lib/slack-digest";

// Tells Slack when Kestrel passes a round number (next tasks item 19e). Called by the daily job. The keys already announced are kept in the
// job_runs table (name "milestones"), so no SQL is needed. The very first run only records where things stand, so nothing old is announced.
// Counts only, no names. Skipped on the demo, whose sample data would trigger them.
export async function sendMilestones(db: SupabaseClient, env: Record<string, string | undefined> = process.env): Promise<void> {
  if (env.DEMO_MODE === "yes") return;
  const [waitlist, clinics, candidates, liveJobs, applications, paidJobs] = await Promise.all([
    countRows(db, "waitlist"),
    countRows(db, "profiles", (q) => q.eq("role", "clinic")),
    countRows(db, "profiles", (q) => q.eq("role", "candidate")),
    countRows(db, "jobs", (q) => q.eq("status", "live")),
    countRows(db, "applications"),
    countRows(db, "job_payments", (q) => q.eq("status", "charged")),
  ]);
  const counts: MilestoneCounts = { waitlist, clinics, candidates, liveJobs, applications, paidJobs };
  const { data: row } = await db.from("job_runs").select("last_result").eq("name", "milestones").maybeSingle();
  const known = row?.last_result && Array.isArray((row.last_result as { reached?: unknown }).reached) ? ((row.last_result as { reached: string[] }).reached) : null;
  const now = reachedKeys(counts);
  if (known === null) {
    await db.from("job_runs").upsert({ name: "milestones", locked_until: null, last_finished_at: new Date().toISOString(), last_result: { reached: now } }, { onConflict: "name" });
    return;
  }
  const fresh = toAnnounce(counts, known);
  // Remember everything reached, so a milestone passed on the way (the 10th when the count jumped to 26) is never announced late.
  await db.from("job_runs").upsert({ name: "milestones", locked_until: null, last_finished_at: new Date().toISOString(), last_result: { reached: Array.from(new Set([...known, ...now])) } }, { onConflict: "name" });
  for (const m of fresh) await notifySlack(m.title, [m.line], { path: "/admin", text: "Open the admin dashboard" }, m.channel);
}
