"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { jobFromForm } from "@/lib/job-form";
import { supabaseAdmin } from "@/lib/supabase-server";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import type { JobFormState } from "@/lib/jobs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// An admin posts a job for a clinic that is having trouble with the form. It follows the same rules as the clinic's own form
// (pay range, the 2 questions, no Canadian experience), belongs to the clinic, and goes to the review queue like any other post.
// The admin then approves it there, or saves it as a draft that the clinic can finish from its own dashboard.
export async function saveJobForClinic(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("admin");
  const employerId = String(form.get("employerId") ?? "");
  if (!UUID.test(employerId)) return { error: "Choose a clinic first." };

  const submit = String(form.get("intent") ?? "") === "submit";
  const { row, errors } = jobFromForm(form, submit);
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };

  const db = supabaseAdmin();
  if (!db) return { error: NOT_CONNECTED };
  const { data: employer } = await db.from("employers").select("id").eq("id", employerId).maybeSingle();
  if (!employer) return { error: "That clinic could not be found." };

  const base = { ...row, employer_id: employerId };
  let { error } = await db.from("jobs").insert({ ...base, posted_by_admin_id: session.userId, posted_by_admin_at: new Date().toISOString() });
  // If migration 0026 has not been run yet, post it anyway without the record of who did it.
  if (error && /posted_by_admin/.test(error.message)) ({ error } = await db.from("jobs").insert(base));
  if (error) {
    console.error("Admin job create failed:", error.code, error.message);
    return { error: "We couldn't save this job. Please check the form and try again." };
  }
  revalidatePath("/admin/review");
  revalidatePath("/clinic");
  redirect(`/admin/post-for-clinic?notice=${submit ? "submitted" : "draft"}`);
}
