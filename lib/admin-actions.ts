"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import type { SupabaseClient } from "@supabase/supabase-js";
import { approveJobNow, rejectJobNow } from "@/lib/job-approval";
import { longDate } from "@/lib/jobs";
import { suppress } from "@/lib/suppression";
import { normaliseAddress } from "@/lib/unsubscribe-token";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notify } from "@/lib/notifications";
import { jobTakenDown } from "@/lib/notify-text";
import { refreshJobPages } from "@/lib/job-cache";
import type { JobFormState } from "@/lib/jobs";
import { reviewMessage, reviewSucceeded } from "@/lib/review-notices";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Publishing and rejecting always go through the server, after checking the person is an admin (lib/job-approval.ts holds the work).
const cleanNote = (form: FormData) => String(form.get("note") ?? "").trim().slice(0, 1000);
const toState = (result: { key: string; why?: string }): JobFormState => (reviewSucceeded(result.key) ? { message: reviewMessage(result.key) } : { error: reviewMessage(result.key, result.why) });

export async function approveJob(form: FormData) {
  await requireRole("admin");
  const result = await approveJobNow(String(form.get("id") ?? ""), "admin");
  revalidatePath("/admin/review");
  redirect(`/admin/review?notice=${result.key}${result.why ? `&why=${encodeURIComponent(result.why)}` : ""}`);
}

export async function rejectJob(form: FormData) {
  await requireRole("admin");
  const result = await rejectJobNow(String(form.get("id") ?? ""), cleanNote(form));
  revalidatePath("/admin/review");
  redirect(`/admin/review?notice=${result.key}`);
}

// The buttons on the review page. They hand back the result and the page stays where it is, with the message under that job. The queue is
// not refreshed, so the job stays on screen showing what happened; it is gone the next time the page is opened.
export async function approveJobQuiet(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  await requireRole("admin");
  return toState(await approveJobNow(String(form.get("id") ?? ""), "admin"));
}

export async function rejectJobQuiet(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  await requireRole("admin");
  return toState(await rejectJobNow(String(form.get("id") ?? ""), cleanNote(form)));
}

// A report is either answered by taking the job down, or dismissed. Both are recorded.
export async function takeDownReportedJob(form: FormData) {
  await requireRole("admin");
  const reportId = String(form.get("id") ?? "");
  const db = supabaseAdmin();
  if (!UUID.test(reportId) || !db) redirect("/admin/reports?notice=error");
  const { data: report } = await db.from("job_reports").select("id, job_id").eq("id", reportId).eq("status", "open").maybeSingle();
  if (!report) redirect("/admin/reports?notice=error");

  const { data: job } = await db.from("jobs").select("id, title, status, employer_id").eq("id", report.job_id).maybeSingle();
  if (job?.status === "live") {
    const { error } = await db.from("jobs").update({ status: "closed" }).eq("id", job.id).eq("status", "live");
    if (error) {
      console.error("Take down failed:", error.code, error.message);
      redirect("/admin/reports?notice=error");
    }
    // Tell the clinic, so a post never just disappears.
    const { data: owner } = await db.from("employers").select("owner_id").eq("id", job.employer_id).maybeSingle();
    await notify(db, owner?.owner_id, jobTakenDown({ jobTitle: job.title }));
    const { data: contact } = await db.from("employer_contacts").select("notify_email").eq("employer_id", job.employer_id).maybeSingle();
    if (contact?.notify_email) {
      const mail = emailLayout({
        heading: "We have taken down one of your jobs",
        paragraphs: [
          `After a report, we took down your post "${job.title}" while we look into it.`,
          "If you think this was a mistake, or you would like to fix the post and put it back up, just reply to this email or write to support@eyecarejobs.ca.",
        ],
        buttonText: "Open your dashboard",
        buttonUrl: `${SITE_URL}/clinic`,
      });
      await sendEmail({ to: contact.notify_email, subject: "We have taken down one of your jobs", ...mail });
    }
  }
  // Any other open reports about the same job are answered by the same step.
  await db.from("job_reports").update({ status: "job_removed", handled_at: new Date().toISOString() }).eq("job_id", report.job_id).eq("status", "open");
  revalidatePath("/admin/reports");
  refreshJobPages();
  redirect("/admin/reports?notice=removed");
}

export async function dismissReport(form: FormData) {
  await requireRole("admin");
  const reportId = String(form.get("id") ?? "");
  const db = supabaseAdmin();
  if (!UUID.test(reportId) || !db) redirect("/admin/reports?notice=error");
  await db.from("job_reports").update({ status: "dismissed", handled_at: new Date().toISOString() }).eq("id", reportId).eq("status", "open");
  revalidatePath("/admin/reports");
  redirect("/admin/reports?notice=dismissed");
}

// The do not email list. Use it when someone asks to stop by email or phone, or to block a whole
// clinic domain (written @clinic.ca).
export async function addSuppression(form: FormData) {
  await requireRole("admin");
  const address = normaliseAddress(String(form.get("address") ?? ""));
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address) || /^@[^\s@]+\.[^\s@]{2,}$/.test(address);
  if (!valid) redirect("/admin/suppressions?notice=bad-address");
  const ok = await suppress(address, "asked_to_stop", "added by admin");
  revalidatePath("/admin/suppressions");
  redirect(`/admin/suppressions?notice=${ok ? "added" : "error"}`);
}

export async function removeSuppression(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id") ?? "");
  const db = supabaseAdmin();
  if (!UUID.test(id) || !db) redirect("/admin/suppressions?notice=error");
  await db.from("email_suppressions").delete().eq("id", id);
  revalidatePath("/admin/suppressions");
  redirect("/admin/suppressions?notice=removed");
}
