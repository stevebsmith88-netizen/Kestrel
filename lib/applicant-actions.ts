"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { APP_LABELS, clinicMoveError, isAppStatus } from "@/lib/applications";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import { candidateRecipient } from "@/lib/recipient";
import type { JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";
import { NOT_CONNECTED } from "@/lib/auth-copy";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A clinic moves an application along. The clinic's right to see this application is
// checked by the database itself (row level security); the change is then made on the server.
export async function setApplicationStatus(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  await requireRole("clinic");
  const id = String(form.get("id") ?? "");
  const to = String(form.get("status") ?? "");
  const message = String(form.get("message") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 1500);
  if (!UUID.test(id) || !isAppStatus(to)) return { error: "That didn't work. Please refresh and try again." };

  const db = await supabaseServer();
  const admin = supabaseAdmin();
  if (!db || !admin) return { error: NOT_CONNECTED };

  const { data: app } = await db.from("applications").select("id, status, keep_details, job_title, clinic_name, applicant, candidate_id").eq("id", id).maybeSingle();
  if (!app) return { error: "We couldn't find that application." };

  const problem = clinicMoveError(app.status, to, app.keep_details, message);
  if (problem) return { errors: { message: problem }, error: problem };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("applications")
    .update({ status: to, clinic_message: message || null, status_changed_at: now, updated_at: now })
    .eq("id", id);
  if (error) {
    console.error("Status change failed:", error.code, error.message);
    return { error: "We couldn't save that change. Please try again." };
  }
  await admin.from("application_events").insert({ application_id: id, status: to, note: message || null });

  const { email, wants } = await candidateRecipient(admin, app.candidate_id, (app.applicant as { email?: string } | null)?.email);
  if (email && wants) {
    const mail = emailLayout({
      heading: "An update on your application",
      paragraphs: [`Your application for ${app.job_title} at ${app.clinic_name} is now: ${APP_LABELS[to]}.`, ...(message ? [message] : [])],
      buttonText: "See your application",
      buttonUrl: `${SITE_URL}/candidate/applications/${id}`,
    });
    await sendEmail({ to: email, subject: `Update on your application: ${app.job_title}`, ...mail });
  }

  revalidatePath(`/clinic/applications/${id}`);
  return { message: "Saved. The candidate is told by email unless they have turned those emails off, and they can always see it in their account." };
}

export async function saveApplicantNote(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  await requireRole("clinic");
  const id = String(form.get("id") ?? "");
  const note = String(form.get("note") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 3000);
  if (!UUID.test(id)) return { error: "That didn't work. Please refresh and try again." };
  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const { error } = await db.from("application_notes").upsert({ application_id: id, note, updated_at: new Date().toISOString() }, { onConflict: "application_id" });
  if (error) {
    console.error("Note save failed:", error.code, error.message);
    return { error: "We couldn't save your note. Please try again." };
  }
  return { message: "Note saved. Only your clinic can see it." };
}
