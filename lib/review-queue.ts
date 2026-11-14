// The admin review queue (review item X-16): every job waiting for review, oldest first, with the clinic's alert address and size, and
// for an edited live job the wording candidates were seeing. Kept out of the page so it can be tested against a stand in database
// (lib/review-queue.test.ts). The page passes the server key connection, since only admins reach it. Kept free of app imports.

import { bandMismatchFlag } from "./checkout-mode.ts";
import type { PayFields } from "./job-pay.ts";
import { employerFlags, longDate, reviewFlags } from "./jobs.ts";

export const REVIEW_COLUMNS =
  "id, title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, work_arrangement, territory, pay_extras, created_at, employer_id, posted_at, expires_at, employers(clinic_name, practice_type, website, city, province, direct_hire_confirmed_at)";

export type QueueJob = PayFields & {
  headline?: string | null;
  tags_software: string[] | null; tags_equipment: string[] | null; tags_specialties: string[] | null;
  id: string; title: string; role_category: string; employment_type: string; province: string; city: string;
  is_existing_vacancy: boolean | null; uses_ai_screening: boolean | null;
  description: string; work_arrangement: string | null; territory: string | null; pay_extras: string | null; apply_method: string; apply_url: string | null; created_at: string; employer_id: string; posted_at: string | null; expires_at: string | null;
  employers: { clinic_name: string; practice_type: string; website: string | null; city: string; province: string; direct_hire_confirmed_at: string | null } | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the Supabase builder, or a stand in for it in the tests
type Db = { from(table: string): any };

export async function loadReviewQueue(db: Db | null, columns: string = REVIEW_COLUMNS) {
  const notifyEmails = new Map<string, string>();
  const bands = new Map<string, string | null>();
  const liveWording = new Map<string, Record<string, unknown>>();
  if (!db) return { jobs: [] as QueueJob[], notifyEmails, bands, liveWording };
  const { data } = await db.from("jobs").select(columns).eq("status", "in_review").order("created_at", { ascending: true });
  const jobs = (data ?? []) as QueueJob[];
  if (jobs.length) {
    const { data: contacts } = await db.from("employer_contacts").select("employer_id, notify_email, employee_band").in("employer_id", [...new Set(jobs.map((j) => j.employer_id))]);
    ((contacts ?? []) as { employer_id: string; notify_email: string; employee_band: string | null }[]).forEach((c) => {
      notifyEmails.set(c.employer_id, c.notify_email);
      bands.set(c.employer_id, c.employee_band);
    });
  }
  // For edited live jobs, the wording candidates were seeing (the most recent copy kept for each job).
  if (jobs.some((j) => j.posted_at)) {
    const { data: versions } = await db.from("job_versions").select("job_id, snapshot").in("job_id", jobs.map((j) => j.id)).order("saved_at", { ascending: false });
    ((versions ?? []) as { job_id: string; snapshot: unknown }[]).forEach((v) => !liveWording.has(v.job_id) && liveWording.set(v.job_id, v.snapshot as Record<string, unknown>));
  }
  return { jobs, notifyEmails, bands, liveWording };
}

// Everything about a waiting job that needs a look before it is approved (Steve, 14th November 2026). The review queue page shows these, and the Slack
// alert gives an Approve button only when there are none, so the 2 always agree. `keptWording` says whether a copy of the earlier wording was kept.
export function queueFlagList(j: QueueJob, notifyEmail: string | null | undefined, keptWording: boolean): string[] {
  const mismatch = bandMismatchFlag(j.title, j.role_category);
  return [
    ...(j.posted_at ? [`Changes to a job that was already live since ${longDate(j.posted_at)}.${keptWording ? " What changed is listed below." : " No copy of the earlier wording was kept for this one."}`] : []),
    ...reviewFlags(j),
    ...(mismatch ? [mismatch] : []),
    ...employerFlags({ website: j.employers?.website, notifyEmail, directHireConfirmedAt: j.employers?.direct_hire_confirmed_at }),
  ];
}

// 1 waiting job with its flags, or nothing if it is not waiting for review.
export async function loadQueueJob(db: Db | null, jobId: string, columns: string = REVIEW_COLUMNS): Promise<{ job: QueueJob; flags: string[] } | null> {
  if (!db) return null;
  const { data } = await db.from("jobs").select(columns).eq("id", jobId).eq("status", "in_review").maybeSingle();
  if (!data) return null;
  const job = data as QueueJob;
  const { data: contact } = await db.from("employer_contacts").select("notify_email").eq("employer_id", job.employer_id).maybeSingle();
  const { data: versions } = job.posted_at ? await db.from("job_versions").select("id").eq("job_id", jobId).limit(1) : { data: [] };
  return { job, flags: queueFlagList(job, contact?.notify_email, Boolean(versions?.length)) };
}
