"use server";

import { notifyAdmin } from "@/lib/notify-admin";
import { REPORT_REASON_LABEL } from "@/lib/reports";
import type { JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const THANKS = "Thank you. We have received your report and will look at the job soon.";

// Anyone can report a job, signed in or not. The report is saved by the server, so nobody can
// write to the table directly.
export async function submitReport(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  // A hidden field only automated sign ups fill in.
  if (String(form.get("website2") ?? "").trim()) return { message: THANKS };

  const jobId = String(form.get("jobId") ?? "");
  const reason = String(form.get("reason") ?? "");
  const details = String(form.get("details") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 1000);
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  if (!UUID.test(jobId)) return { error: "We couldn't find that job." };
  if (!REPORT_REASON_LABEL[reason]) return { error: "Please choose what is wrong with the job." };
  if (email && !EMAIL.test(email)) return { error: "That email address doesn't look right. You can also leave it blank." };
  if (reason === "other" && details.length < 10) return { error: "Please tell us a little about what is wrong." };

  const db = supabaseAdmin();
  if (!db) return { error: "Reporting isn't available right now. Please email hello@eyecarejobs.ca." };

  const { data: job } = await db.from("jobs").select("id, title").eq("id", jobId).maybeSingle();
  if (!job) return { error: "We couldn't find that job." };

  // Too many in a day on one job looks like abuse. Say thanks, but don't pile them up.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db.from("job_reports").select("id", { count: "exact", head: true }).eq("job_id", jobId).gte("created_at", since);
  if ((count ?? 0) >= 10) return { message: THANKS };

  const { error } = await db.from("job_reports").insert({ job_id: jobId, reason, details: details || null, reporter_email: email || null });
  if (error) {
    console.error("Report failed:", error.code, error.message);
    return { error: "We couldn't send your report. Please try again, or email hello@eyecarejobs.ca." };
  }
  await notifyAdmin("A job has been reported", [`${job.title}`, REPORT_REASON_LABEL[reason]], "/admin/reports");
  return { message: THANKS };
}
