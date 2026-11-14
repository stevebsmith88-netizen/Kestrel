"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cardRefusedEmail, jobLiveEmail, jobNeedsChangeEmail } from "@/lib/clinic-emails";
import { cancelPaymentForJob, chargeForJob } from "@/lib/job-payment-flow";
import { expiryFrom, isQuebecJob, longDate } from "@/lib/jobs";
import { suppress } from "@/lib/suppression";
import { normaliseAddress } from "@/lib/unsubscribe-token";
import { supabaseAdmin } from "@/lib/supabase-server";
import { notify } from "@/lib/notifications";
import { cardRefused, jobApproved, jobNeedsChange, jobTakenDown } from "@/lib/notify-text";
import { refreshJobPages } from "@/lib/job-cache";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Publishing and rejecting always go through the server, after checking the person is an
// admin. No browser can publish a job by itself.
// Tells the clinic what happened to their job. Never stops the approval if the email fails.
async function emailClinic(db: SupabaseClient, jobId: string, kind: "live" | "needs-change", extra: { wasEdit?: boolean; note?: string } = {}) {
  const { data: job } = await db.from("jobs").select("title, employer_id, expires_at").eq("id", jobId).maybeSingle();
  if (!job) return;
  const { data: owner } = await db.from("employers").select("owner_id").eq("id", job.employer_id).maybeSingle();
  await notify(db, owner?.owner_id, kind === "live" ? jobApproved({ jobTitle: job.title, jobId, wasEdit: Boolean(extra.wasEdit) }) : jobNeedsChange({ jobTitle: job.title, jobId, note: extra.note ?? "" }));
  const { data: contact } = await db.from("employer_contacts").select("notify_email").eq("employer_id", job.employer_id).maybeSingle();
  if (!contact?.notify_email) return;
  const mail =
    kind === "live"
      ? jobLiveEmail({ title: job.title, jobId, expiresLabel: job.expires_at ? longDate(job.expires_at) : null, wasEdit: Boolean(extra.wasEdit) })
      : jobNeedsChangeEmail({ title: job.title, jobId, note: extra.note ?? "" });
  await sendEmail({ to: contact.notify_email, ...mail });
}

export async function approveJob(form: FormData) {
  await requireRole("admin");
  const id = String(form.get("id") ?? "");
  const db = supabaseAdmin();
  if (!UUID.test(id) || !db) redirect("/admin/review?notice=error");
  const now = new Date();
  // A job that was live before (it was edited and sent back) keeps its original 30 days. Otherwise editing
  // would be a way to keep a job live for ever.
  const { data: before } = await db.from("jobs").select("posted_at, expires_at, province").eq("id", id).eq("status", "in_review").maybeSingle();
  // The form refuses Quebec, so a Quebec job here reached the queue another way. It is never made live (the database refuses it too).
  if (before && isQuebecJob(before)) redirect("/admin/review?notice=quebec");
  // The card saved when the clinic sent the job is charged now, for the price of the role. A job with nothing to charge goes straight through.
  // If the card is refused the job stays in the queue, the clinic is asked for a new card, and nothing is published.
  if (before) {
    const charge = await chargeForJob(id);
    if (!charge.ok) {
      // Only a refused card is the clinic's to fix. Any other problem is for Kestrel, so the clinic is not emailed.
      if (charge.cardRefused) {
        const { data: job } = await db.from("jobs").select("title, employer_id").eq("id", id).maybeSingle();
        if (job) {
          const { data: owner } = await db.from("employers").select("owner_id").eq("id", job.employer_id).maybeSingle();
          await notify(db, owner?.owner_id, cardRefused({ jobTitle: job.title, jobId: id }));
          const { data: contact } = await db.from("employer_contacts").select("notify_email").eq("employer_id", job.employer_id).maybeSingle();
          if (contact?.notify_email) await sendEmail({ to: contact.notify_email, ...cardRefusedEmail({ title: job.title, jobId: id }) });
        }
      }
      redirect(`/admin/review?notice=${charge.cardRefused ? "payment-failed" : "payment-error"}&why=${encodeURIComponent(charge.message.slice(0, 200))}`);
    }
  }
  const dates = before?.posted_at && before?.expires_at ? {} : { posted_at: now.toISOString(), expires_at: expiryFrom(now).toISOString() };
  const { data, error } = await db
    .from("jobs")
    .update({ status: "live", ...dates, review_note: null })
    .eq("id", id)
    .eq("status", "in_review")
    .select("id");
  if (error || !data?.length) {
    console.error("Approve failed:", error?.code, error?.message);
    redirect("/admin/review?notice=error");
  }
  await emailClinic(db, id, "live", { wasEdit: Boolean(before?.posted_at) });
  revalidatePath("/admin/review");
  refreshJobPages();
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
  // The job was not approved, so a card saved for it is never charged.
  await cancelPaymentForJob(db, id);
  await emailClinic(db, id, "needs-change", { note });
  revalidatePath("/admin/review");
  redirect("/admin/review?notice=rejected");
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
