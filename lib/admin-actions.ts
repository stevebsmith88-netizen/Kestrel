"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { expiryFrom } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Publishing and rejecting always go through the server, after checking the person is an
// admin. No browser can publish a job by itself.
export async function approveJob(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id") ?? "");
  const db = supabaseAdmin();
  if (!UUID.test(id) || !db) redirect("/admin/review?notice=error");
  const now = new Date();
  const { data, error } = await db
    .from("jobs")
    .update({ status: "live", posted_at: now.toISOString(), expires_at: expiryFrom(now).toISOString(), review_note: null })
    .eq("id", id)
    .eq("status", "in_review")
    .select("id");
  if (error || !data?.length) {
    console.error("Approve failed:", error?.code, error?.message);
    redirect("/admin/review?notice=error");
  }
  revalidatePath("/admin/review");
  revalidatePath("/jobs");
  redirect("/admin/review?notice=approved");
}

export async function rejectJob(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id") ?? "");
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  const db = supabaseAdmin();
  if (!UUID.test(id) || !db) redirect("/admin/review?notice=error");
  if (!note) redirect("/admin/review?notice=need-note");
  const { data, error } = await db.from("jobs").update({ status: "rejected", review_note: note }).eq("id", id).eq("status", "in_review").select("id");
  if (error || !data?.length) {
    console.error("Reject failed:", error?.code, error?.message);
    redirect("/admin/review?notice=error");
  }
  revalidatePath("/admin/review");
  redirect("/admin/review?notice=rejected");
}
