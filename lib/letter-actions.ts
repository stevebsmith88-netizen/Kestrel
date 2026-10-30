"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { cleanCoverLetter } from "@/lib/applications";
import type { JobFormState } from "@/lib/jobs";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Keeps a half written cover letter for one job, so the candidate can come back to it.
export async function saveApplicationDraft(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate");
  const jobId = String(form.get("jobId") ?? "");
  if (!UUID.test(jobId)) return { error: "We couldn't find that job." };
  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const { error } = await db.from("application_drafts").upsert({ user_id: session.userId, job_id: jobId, cover_letter: cleanCoverLetter(form.get("coverLetter")) }, { onConflict: "user_id,job_id" });
  if (error) {
    console.error("Draft save failed:", error.code, error.message);
    return { error: "We couldn't save your draft. Please try again." };
  }
  return { message: "Draft saved. You can come back to it any time before the job closes." };
}

// A reusable cover letter, kept in the candidate's account. Up to 5.
export async function saveLetterTemplate(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate");
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const body = cleanCoverLetter(form.get("body"));
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Give the letter a name, such as Optician, independent clinic.";
  if (body.length < 20) errors.body = "Write a little more, at least a couple of sentences.";
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const { error } = await db.from("cover_letter_templates").upsert({ user_id: session.userId, name, body }, { onConflict: "user_id,name" });
  if (error) {
    if (/up to 5/i.test(error.message)) return { error: "You can save up to 5 cover letters. Delete one to add another." };
    console.error("Letter save failed:", error.code, error.message);
    return { error: "We couldn't save that letter. Please try again." };
  }
  revalidatePath("/candidate/letters");
  return { message: "Letter saved. You can start any application from it." };
}

export async function deleteLetterTemplate(form: FormData) {
  await requireRole("candidate");
  const id = String(form.get("id") ?? "");
  const db = await supabaseServer();
  if (UUID.test(id) && db) await db.from("cover_letter_templates").delete().eq("id", id);
  revalidatePath("/candidate/letters");
}
