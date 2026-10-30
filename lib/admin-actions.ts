"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
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
    const { data: contact } = await db.from("employer_contacts").select("notify_email").eq("employer_id", job.employer_id).maybeSingle();
    if (contact?.notify_email) {
      const mail = emailLayout({
        heading: "We have taken down one of your jobs",
        paragraphs: [
          `After a report, we took down your post "${job.title}" while we look into it.`,
          "If you think this was a mistake, or you would like to fix the post and put it back up, just reply to this email or write to hello@eyecarejobs.ca.",
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
  revalidatePath("/jobs");
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
