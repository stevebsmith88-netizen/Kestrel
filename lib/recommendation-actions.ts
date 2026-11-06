"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// "Not interested": the job stops appearing in this candidate's recommendations. Nobody else sees this, and it does not affect the job.
export async function hideRecommendation(form: FormData): Promise<void> {
  const session = await requireRole("candidate");
  const jobId = String(form.get("jobId") ?? "");
  if (!UUID.test(jobId)) return;
  const db = await supabaseServer();
  if (!db) return;
  const { error } = await db.from("candidate_job_hides").insert({ user_id: session.userId, job_id: jobId });
  // 23505 means it was already hidden, which is fine.
  if (error && error.code !== "23505") console.error("Hiding a recommendation failed:", error.code, error.message);
  revalidatePath("/candidate");
}
