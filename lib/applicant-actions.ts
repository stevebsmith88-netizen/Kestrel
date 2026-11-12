"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_LABELS, HIREABLE, clinicMoveError, isAppStatus, messageTemplate } from "@/lib/applications";
import { SITE_URL, sendEmail } from "@/lib/email";
import { applicationUpdateEmail } from "@/lib/clinic-message";
import { candidateRecipient } from "@/lib/recipient";
import { notify } from "@/lib/notifications";
import { applicationMoved } from "@/lib/notify-text";
import type { JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { parseFillSource } from "@/lib/job-ending";
import { BULK_PROBLEMS, declinedText, movedText } from "@/lib/bulk-notices";
import type { QuickState } from "@/lib/dashboard-notices";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AppForEmail = { id: string; candidate_id: string; applicant: unknown; job_title: string; clinic_name: string };

// Tells the candidate by email, unless they have turned those emails off. They can always see the update in their account.
async function tellCandidate(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, app: AppForEmail, to: string, message: string) {
  // The inbox always gets the update, whatever the candidate chose about email. A shortlist is private to the clinic, so it is never announced.
  await notify(admin, app.candidate_id, applicationMoved({ jobTitle: app.job_title, clinicName: app.clinic_name, status: to, label: APP_LABELS[to as keyof typeof APP_LABELS], message, applicationId: app.id }));
  const { email, wants } = await candidateRecipient(admin, app.candidate_id, (app.applicant as { email?: string } | null)?.email);
  if (email && wants) {
    // The clinic's words go as plain text, with a line saying the clinic wrote them (P1-47).
    const mail = applicationUpdateEmail({ jobTitle: app.job_title, clinicName: app.clinic_name, label: APP_LABELS[to as keyof typeof APP_LABELS], message, applicationId: app.id, site: SITE_URL });
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

// The 3 bulk actions for the buttons on the applicants page, which save without leaving the page: they hand back the words to show
// in a small message (and its tone), and the page refreshes where it stands, so nothing jumps to the top. (declineSelected above is
// the page form's own action, and the only one that reloads the page.)
const bulkAnswer = (text: string, tone: "ok" | "warn" = "ok"): QuickState => ({ notice: "bulk", text, tone });

export async function shortlistSelectedQuiet(_prev: QuickState, form: FormData): Promise<QuickState> {
  await requireRole("clinic");
  const jobId = String(form.get("jobId") ?? "");
  const ids = pickedIds(form);
  if (!UUID.test(jobId)) redirect("/clinic");
  if (!ids.length) return bulkAnswer(BULK_PROBLEMS.none, "warn");
  const { moved, skipped } = await moveWaiting(jobId, ids, "shortlisted", { message: "", tell: false });
  revalidatePath(`/clinic/jobs/${jobId}/applicants`);
  return bulkAnswer(movedText("shortlisted", moved, skipped));
}

export async function interviewSelectedQuiet(_prev: QuickState, form: FormData): Promise<QuickState> {
  await requireRole("clinic");
  const jobId = String(form.get("jobId") ?? "");
  const ids = pickedIds(form);
  if (!UUID.test(jobId)) redirect("/clinic");
  if (!ids.length) return bulkAnswer(BULK_PROBLEMS.none, "warn");
  const message = String(form.get("message") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 1500);
  if (clinicMoveError("viewed", "interview", true, message)) return bulkAnswer(message ? BULK_PROBLEMS.brackets : BULK_PROBLEMS.message, "warn");
  const { moved, skipped } = await moveWaiting(jobId, ids, "interview", { message });
  revalidatePath(`/clinic/jobs/${jobId}/applicants`);
  return bulkAnswer(movedText("interview", moved, skipped));
}

export async function declineSelectedQuiet(_prev: QuickState, form: FormData): Promise<QuickState> {
  await requireRole("clinic");
  const jobId = String(form.get("jobId") ?? "");
  const ids = pickedIds(form);
  if (!UUID.test(jobId)) redirect("/clinic");
  if (!ids.length) return bulkAnswer(BULK_PROBLEMS.none, "warn");
  const done = await closeWaiting(jobId, ids, "not_selected");
  revalidatePath(`/clinic/jobs/${jobId}/applicants`);
  return bulkAnswer(declinedText(done));
}

// The clinic names the person it hired. Their application moves to Hired (a final step), the job remembers which application it was, and
// the candidate is told, by email unless they turned those emails off, and in their account. Only someone still in the running can be named.
async function markHired(jobId: string, applicationId: string): Promise<boolean> {
  const db = await supabaseServer();
  const admin = supabaseAdmin();
  if (!db || !admin) return false;
  const { data: app } = await db.from("applications").select("id, status, job_title, clinic_name, applicant, candidate_id").eq("id", applicationId).eq("job_id", jobId).in("status", [...HIREABLE]).maybeSingle();
  if (!app) return false;
  const message = messageTemplate("hired", app.clinic_name);
  const now = new Date().toISOString();
  const { error } = await admin.from("applications").update({ status: "hired", clinic_message: message, status_changed_at: now, updated_at: now }).eq("id", app.id);
  if (error) return false;
  await admin.from("application_events").insert({ application_id: app.id, status: "hired", note: message });
  await admin.from("jobs").update({ filled_application_id: app.id }).eq("id", jobId);
  await tellCandidate(admin, app, "hired", message);
  return true;
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
  // If the clinic says it found the person through Kestrel and names them, that person is marked as Hired and told first, so they are
  // not then sent the "role filled" message below (it only goes to people still waiting).
  const hiredId = via === "kestrel" ? String(form.get("hiredApplicationId") ?? "") : "";
  if (UUID.test(hiredId)) await markHired(jobId, hiredId);
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
