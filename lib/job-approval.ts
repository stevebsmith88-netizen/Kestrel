import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cardRefusedEmail, jobLiveEmail, jobNeedsChangeEmail } from "@/lib/clinic-emails";
import { sendEmail } from "@/lib/email";
import { logJobActivity } from "@/lib/job-activity";
import { refreshJobPages } from "@/lib/job-cache";
import { cancelPaymentForJob, chargeForJob } from "@/lib/job-payment-flow";
import { expiryFrom, isQuebecJob, longDate } from "@/lib/jobs";
import { notify } from "@/lib/notifications";
import { cardRefused, jobApproved, jobNeedsChange } from "@/lib/notify-text";
import { supabaseAdmin } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Approving and sending back a job, in one place. The admin's buttons call these (lib/admin-actions.ts, after checking the person is an admin),
// and so does a clinic saving a new card for a job that was approved but could not be charged (lib/job-payment-flow.ts, as the system).
// Publishing always goes through the server: no browser can publish a job by itself.

// Tells the clinic what happened to their job. Never stops the approval if the email fails.
export async function emailClinic(db: SupabaseClient, jobId: string, kind: "live" | "needs-change", extra: { wasEdit?: boolean; note?: string } = {}) {
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

// The result: the key of the message to show (lib/review-notices.ts) and, for a payment problem, a short plain reason.
export type ApprovalResult = { key: string; why?: string };

export async function approveJobNow(id: string, actor: "admin" | "system"): Promise<ApprovalResult> {
  const db = supabaseAdmin();
  if (!UUID.test(id) || !db) return { key: "error" };
  const now = new Date();
  // A job that was live before (it was edited and sent back) keeps its original 30 days. Otherwise editing
  // would be a way to keep a job live for ever.
  const { data: before } = await db.from("jobs").select("posted_at, expires_at, province").eq("id", id).eq("status", "in_review").maybeSingle();
  // The form refuses Quebec, so a Quebec job here reached the queue another way. It is never made live (the database refuses it too).
  if (before && isQuebecJob(before)) return { key: "quebec" };
  // The card saved when the clinic sent the job is charged now, for the price of the role. A job with nothing to charge goes straight through.
  // If the card is refused the job stays in the queue, the clinic is asked for a new card, and nothing is published.
  if (before) {
    if (actor === "admin") await logJobActivity(db, id, "Approved by Kestrel", { actor: "admin" });
    else await logJobActivity(db, id, "Approved again automatically after the clinic saved a new card");
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
          await logJobActivity(db, id, `Asked the clinic for a new card (${charge.message})`);
        }
      }
      return { key: charge.cardRefused ? "payment-failed" : "payment-error", why: charge.message.slice(0, 200) };
    }
  }
  const dates = before?.posted_at && before?.expires_at ? {} : { posted_at: now.toISOString(), expires_at: expiryFrom(now).toISOString() };
  const { data, error } = await db
    .from("jobs")
    .update({ status: "live", ...dates, review_note: null })
    .eq("id", id)
    .eq("status", "in_review")
    .select("id, expires_at");
  if (error || !data?.length) {
    console.error("Approve failed:", error?.code, error?.message);
    return { key: "error" };
  }
  await logJobActivity(db, id, `Went live${data[0].expires_at ? `, runs until ${longDate(data[0].expires_at)}` : ""}`);
  await emailClinic(db, id, "live", { wasEdit: Boolean(before?.posted_at) });
  refreshJobPages();
  return { key: "approved" };
}

export async function rejectJobNow(id: string, note: string): Promise<ApprovalResult> {
  const db = supabaseAdmin();
  if (!UUID.test(id) || !db) return { key: "error" };
  if (!note) return { key: "need-note" };
  const { data, error } = await db.from("jobs").update({ status: "rejected", review_note: note }).eq("id", id).eq("status", "in_review").select("id");
  if (error || !data?.length) {
    console.error("Reject failed:", error?.code, error?.message);
    return { key: "error" };
  }
  // The job was not approved, so a card saved for it is never charged.
  await cancelPaymentForJob(db, id);
  await logJobActivity(db, id, `Sent back to the clinic: ${note.slice(0, 200)}`, { actor: "admin" });
  await emailClinic(db, id, "needs-change", { note });
  refreshJobPages();
  return { key: "rejected" };
}
