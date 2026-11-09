"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_LABELS, clinicMoveError, isAppStatus, messageTemplate } from "@/lib/applications";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import { candidateRecipient } from "@/lib/recipient";
import type { JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { parseFillSource } from "@/lib/job-ending";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AppForEmail = { id: string; candidate_id: string; applicant: unknown; job_title: string; clinic_name: string };

// Tells the candidate by email, unless they have turned those emails off. They can always see the update in their account.
async function tellCandidate(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, app: AppForEmail, to: string, message: string) {
  const { email, wants } = await candidateRecipient(admin, app.candidate_id, (app.applicant as { email?: string } | null)?.email);
  if (email && wants) {
    const mail = emailLayout({
      heading: "An update on your application",
      paragraphs: [`Your application for ${app.job_title} at ${app.clinic_name} is now: ${APP_LABELS[to as keyof typeof APP_LABELS]}.`, ...(message ? [message] : [])],
      buttonText: "See your application",
      buttonUrl: `${SITE_URL}/candidate/applications/${app.id}`,
    });
    await sendEmail({ to: email, subject: `Update on your application: ${app.job_title}`, ...mail });
  }
}

// Still waiting on a decision. Interviews and offers are never closed in bulk.
const WAITING = ["applied", "viewed", "shortlisted"];

// Moves several waiting applications to one step. The clinic's right to see them is checked by the database (row level security) when
// they are read, then each change is made on the server. By default the message is the kind ready made one for that step, and each
// candidate is told by email (unless they turned those emails off). A step can be made quietly instead: shortlisting is a private
// step for the clinic, so it sends no email, and the candidate sees it in their account. Applications that cannot make the move
// (already at that step, withdrawn) are skipped and counted.
async function moveWaiting(jobId: string, ids: string[] | null, to: "shortlisted" | "interview" | "not_selected" | "role_filled", opts: { message?: string; tell?: boolean } = {}): Promise<{ moved: number; skipped: number }> {
  const db = await supabaseServer();
  const admin = supabaseAdmin();
  if (!db || !admin) return { moved: 0, skipped: 0 };
  let query = db.from("applications").select("id, status, keep_details, job_title, clinic_name, applicant, candidate_id").eq("job_id", jobId).in("status", WAITING);
  if (ids) query = query.in("id", ids);
  const { data } = await query.limit(500);
  let moved = 0;
  let skipped = 0;
  for (const app of data ?? []) {
    const message = opts.message ?? messageTemplate(to, app.clinic_name);
    if (clinicMoveError(app.status, to, app.keep_details, message)) { skipped += 1; continue; }
    const now = new Date().toISOString();
    const { error } = await admin.from("applications").update({ status: to, clinic_message: message || null, status_changed_at: now, updated_at: now }).eq("id", app.id);
    if (error) { skipped += 1; continue; }
    await admin.from("application_events").insert({ application_id: app.id, status: to, note: message || null });
    if (opts.tell !== false) await tellCandidate(admin, app, to, message);
    moved += 1;
  }
  return { moved, skipped };
}

// Closing steps: the kind no, and "the role is filled". Each candidate is told.
async function closeWaiting(jobId: string, ids: string[] | null, to: "not_selected" | "role_filled"): Promise<number> {
  return (await moveWaiting(jobId, ids, to)).moved;
}

const BULK_MAX = 100;
const pickedIds = (form: FormData) => form.getAll("ids").map(String).filter((x) => UUID.test(x)).slice(0, BULK_MAX);

// Tick some applicants and shortlist them. This sends no email: a shortlist is the clinic's own working list, and a candidate
// who was told they were shortlisted and then did not get an interview would feel worse for it.
export async function shortlistSelected(form: FormData) {
  await requireRole("clinic");
  const jobId = String(form.get("jobId") ?? "");
  if (!UUID.test(jobId)) redirect("/clinic");
  const ids = pickedIds(form);
  if (!ids.length) redirect(`/clinic/jobs/${jobId}/applicants?bulkerror=none`);
  const { moved, skipped } = await moveWaiting(jobId, ids, "shortlisted", { message: "", tell: false });
  revalidatePath(`/clinic/jobs/${jobId}/applicants`);
  redirect(`/clinic/jobs/${jobId}/applicants?moved=shortlisted&n=${moved}&skipped=${skipped}`);
}

// Tick some applicants and invite them all to interview with one message the clinic writes (the date, time and how to join).
// Everyone gets the same words, by email and in their account. For different times, open each application instead.
export async function interviewSelected(form: FormData) {
  await requireRole("clinic");
  const jobId = String(form.get("jobId") ?? "");
  if (!UUID.test(jobId)) redirect("/clinic");
  const ids = pickedIds(form);
  if (!ids.length) redirect(`/clinic/jobs/${jobId}/applicants?bulkerror=none`);
  const message = String(form.get("message") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 1500);
  const problem = clinicMoveError("viewed", "interview", true, message);
  if (problem) redirect(`/clinic/jobs/${jobId}/applicants?bulkerror=${message ? "brackets" : "message"}`);
  const { moved, skipped } = await moveWaiting(jobId, ids, "interview", { message });
  revalidatePath(`/clinic/jobs/${jobId}/applicants`);
  redirect(`/clinic/jobs/${jobId}/applicants?moved=interview&n=${moved}&skipped=${skipped}`);
}

// Tick some applicants and send each a kind no, using the same wording as sending one at a time.
export async function declineSelected(form: FormData) {
  await requireRole("clinic");
  const jobId = String(form.get("jobId") ?? "");
  const ids = pickedIds(form);
  if (!UUID.test(jobId)) redirect("/clinic");
  if (!ids.length) redirect(`/clinic/jobs/${jobId}/applicants?bulkerror=none`);
  const done = await closeWaiting(jobId, ids, "not_selected");
  revalidatePath(`/clinic/jobs/${jobId}/applicants`);
  redirect(`/clinic/jobs/${jobId}/applicants?sent=${done}`);
}

// The role is filled: close the job, let everyone still waiting know, kindly, and record how the clinic filled it
// if they told us (from the job's ending page). An expired job is not reopened; only the answer is saved.
export async function fillRole(form: FormData) {
  await requireRole("clinic");
  const jobId = String(form.get("jobId") ?? "");
  const fromEnding = String(form.get("from") ?? "") === "ending";
  if (!UUID.test(jobId)) redirect("/clinic");
  const db = await supabaseServer();
  if (!db) redirect("/clinic");
  const { data: mine } = await db.from("jobs").select("id").eq("id", jobId).maybeSingle();
  if (!mine) redirect("/clinic");
  await db.from("jobs").update({ status: "closed" }).eq("id", jobId).in("status", ["live", "draft", "rejected"]);
  const { via, other } = parseFillSource(form.get("filledVia"), form.get("filledViaOther"));
  const admin = supabaseAdmin();
  if (admin) await admin.from("jobs").update({ filled_at: new Date().toISOString(), filled_via: via, filled_via_other: other }).eq("id", jobId);
  const done = await closeWaiting(jobId, null, "role_filled");
  revalidatePath("/clinic");
  revalidatePath("/jobs");
  revalidatePath(`/clinic/jobs/${jobId}/applicants`);
  if (fromEnding) redirect(`/clinic?notice=job-filled&sent=${done}`);
  redirect(`/clinic/jobs/${jobId}/applicants?sent=${done}&filled=1`);
}

// A clinic moves an application along. The clinic's right to see this application is
// checked by the database itself (row level security); the change is then made on the server.
export async function setApplicationStatus(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  await requireRole("clinic");
  const id = String(form.get("id") ?? "");
  const to = String(form.get("status") ?? "");
  // Shortlisting is the clinic's own working list: no message goes with it and the candidate is not emailed.
  const quiet = to === "shortlisted";
  const message = quiet ? "" : String(form.get("message") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 1500);
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

  if (!quiet) await tellCandidate(admin, { id, candidate_id: app.candidate_id, applicant: app.applicant, job_title: app.job_title, clinic_name: app.clinic_name }, to, message);

  revalidatePath(`/clinic/applications/${id}`);
  return { message: quiet ? "Saved. Shortlisting is your own working list, so the candidate was not emailed." : "Saved. The candidate is told by email unless they have turned those emails off, and they can always see it in their account." };
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
