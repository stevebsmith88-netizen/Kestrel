"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import type { QuickState } from "@/lib/dashboard-notices";
import { addDismissed, DISMISS_COOKIE, DISMISS_DAYS } from "@/lib/notice-dismiss";
import { getMyEmployer } from "@/lib/clinic";
import { clinicChangeParagraphs, clinicChanges } from "@/lib/clinic-changes";
import { jobFromForm } from "@/lib/job-form";
import { fitExpected, withExpected } from "@/lib/expected-columns";
import { notifyAdmin } from "@/lib/notify-admin";
import { cleanClinic, isQuebecJob, validateClinic, type JobFormState } from "@/lib/jobs";
import { updateThenInsert } from "@/lib/save-helpers";
import { supabaseServer } from "@/lib/supabase/server";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { canExtend, extendedUntil } from "@/lib/job-ending";
import { supabaseAdmin } from "@/lib/supabase-server";
import { refreshJobPages } from "@/lib/job-cache";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const field = (form: FormData, key: string) => form.get(key) ?? "";
const idFrom = (form: FormData) => {
  const id = String(form.get("id") ?? "");
  return UUID.test(id) ? id : null;
};

export async function saveClinic(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("clinic");
  const clinic = cleanClinic({
    clinicName: field(form, "clinicName"),
    practiceType: field(form, "practiceType"),
    website: field(form, "website"),
    province: field(form, "province"),
    city: field(form, "city"),
    about: field(form, "about"),
    notifyEmail: field(form, "notifyEmail"),
    directHire: form.get("directHire") === "yes",
    employeeBand: field(form, "employeeBand"),
  });
  // The staff count is optional (Steve, 13th November 2026): it is for Kestrel only and changes no rule, so it should not slow a clinic down.
  const errors = validateClinic(clinic);
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };

  const existing = await getMyEmployer(session.userId);
  const row = {
    clinic_name: clinic.clinicName,
    practice_type: clinic.practiceType,
    website: clinic.website || null,
    province: clinic.province,
    city: clinic.city,
    about: clinic.about || null,
    // Keep the first date they confirmed.
    direct_hire_confirmed_at: existing?.direct_hire_confirmed_at ?? new Date().toISOString(),
  };

  let employerId = existing?.id;
  if (existing) {
    const { error } = await db.from("employers").update(row).eq("id", existing.id);
    if (error) {
      console.error("Clinic update failed:", error.code, error.message);
      return { error: "We couldn't save your clinic profile. Please try again." };
    }
    // The clinic name, website and About text show on live job pages without a review. If this clinic has live jobs, tell the admin what changed.
    const changes = clinicChanges(existing, row);
    if (changes.length) {
      const { count } = await db.from("jobs").select("id", { count: "exact", head: true }).eq("employer_id", existing.id).eq("status", "live");
      if (count && count > 0) await notifyAdmin("A clinic with live jobs changed its profile", clinicChangeParagraphs(clinic.clinicName, changes), "/admin/review");
    }
  } else {
    const { data, error } = await db.from("employers").insert({ ...row, owner_id: session.userId }).select("id").single();
    if (error || !data) {
      console.error("Clinic create failed:", error?.code, error?.message);
      return { error: "We couldn't save your clinic profile. Please try again." };
    }
    employerId = data.id;
  }

  const { error: contactError } = await db.from("employer_contacts").upsert({ employer_id: employerId, notify_email: clinic.notifyEmail, ...(clinic.employeeBand ? { employee_band: clinic.employeeBand } : {}) }, { onConflict: "employer_id" });
  if (contactError) {
    console.error("Clinic contact save failed:", contactError.code, contactError.message);
    return { error: "We saved your profile but not your alert email. Please try again." };
  }

  revalidatePath("/clinic");
  refreshJobPages(); // the clinic name and about text appear on its saved job pages
  // A new clinic goes straight on to its first post (Steve, 13th November 2026), with no stop on the empty dashboard.
  if (!existing) redirect("/clinic/jobs/new?notice=profile-created");
  return { message: "Your clinic profile is saved." };
}

// What a template keeps from a job: everything except the status and the two questions that must be answered fresh.
const templateFields = (row: {
  title: string; role_category: string | null; employment_type: string | null; province: string | null; city: string | null;
  pay_period: string | null; pay_min: number | null; pay_max: number | null; description: string | null; apply_method: string;
  apply_url: string | null; work_arrangement: string; territory: string | null; pay_extras: string | null;
  pay_is_minimum: boolean | null; pay_days_per_week: number | null; pay_percent_min: number | null; pay_percent_max: number | null; pay_percent_of: string | null;
  tags_software: string[] | null; tags_equipment: string[] | null; tags_specialties: string[] | null;
}) => ({
  pay_is_minimum: row.pay_is_minimum ?? false, pay_days_per_week: row.pay_days_per_week, pay_percent_min: row.pay_percent_min, pay_percent_max: row.pay_percent_max, pay_percent_of: row.pay_percent_of,
  tags_software: row.tags_software ?? [], tags_equipment: row.tags_equipment ?? [], tags_specialties: row.tags_specialties ?? [],
  title: row.title, role_category: row.role_category, employment_type: row.employment_type, province: row.province, city: row.city,
  pay_period: row.pay_period, pay_min: row.pay_min, pay_max: row.pay_max, description: row.description, apply_method: row.apply_method,
  apply_url: row.apply_url, work_arrangement: row.work_arrangement, territory: row.territory, pay_extras: row.pay_extras,
});

export async function saveJob(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("clinic");
  const employer = await getMyEmployer(session.userId);
  if (!employer) redirect("/clinic/profile");

  const submit = String(form.get("intent") ?? "") === "submit";
  const { job, row, errors } = jobFromForm(form, submit);
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };


  const id = idFrom(form);
  // A live job can be edited, but only by sending the changes to be read again. It is offline until they are approved.
  let wasLive = false;
  if (id) {
    const { data: current } = await db.from("jobs").select("status").eq("id", id).maybeSingle();
    wasLive = current?.status === "live";
    if (wasLive && !submit) return { error: "A live job can't be saved as a draft. Send your changes for review, or close the job." };
  }
  if (id) {
    const { data, error } = await db.from("jobs").update(await fitExpected(row)).eq("id", id).select("id");
    if (error || !data?.length) {
      console.error("Job update failed:", error?.code, error?.message);
      return { error: "We couldn't save this job. It may already be in review or live." };
    }
  } else {
    const { error } = await db.from("jobs").insert(await fitExpected({ ...row, employer_id: employer.id }));
    if (error) {
      console.error("Job create failed:", error.code, error.message);
      return { error: "We couldn't save this job. Please check the form and try again." };
    }
  }

  // Optionally keep this post as a template for next time (the two required questions are not kept).
  let savedTemplate = false;
  let templateFailed = false;
  if (field(form, "saveTemplate") === "yes") {
    const name = (String(field(form, "templateName")).trim() || job.title).slice(0, 80);
    const fields = templateFields(row);
    const { error: templateError } = await updateThenInsert(db, "job_templates", { employer_id: employer.id, name }, { ...fields }, { employer_id: employer.id, name, ...fields });
    if (templateError) {
      console.error("Template save failed:", templateError.code, templateError.message);
      templateFailed = true;
    } else savedTemplate = true;
  }
  if (submit) await notifyAdmin(wasLive ? "A live job was edited and needs review" : "A job is waiting for review", [`${job.title}`, `${employer.clinic_name}`], "/admin/review");
  revalidatePath("/clinic");
  refreshJobPages();
  redirect(`/clinic?notice=${wasLive ? "job-edited" : submit ? "job-submitted" : "job-saved"}${savedTemplate ? "&template=1" : templateFailed ? "&template=failed" : ""}`);
}

// Each dashboard button does its work in a plain function that hands back the key of the message to show (lib/dashboard-notices.ts).
// There are 2 ways to use it. The page buttons use the "Quiet" versions: they save, refresh the dashboard where it stands, and let the
// page show the message in place, so nothing jumps to the top. The older versions send the person to /clinic?notice=... and are kept
// for pages that need to go somewhere afterwards (the job ending page) and for browsers without scripts.
const quiet = (notice: string): QuickState => {
  revalidatePath("/clinic");
  return { notice };
};

// Clears one or more of the green "approved and now live" messages on the dashboard. Kept in a cookie in this browser (see
// lib/notice-dismiss.ts), so it changes nothing in the database and nothing about the jobs.
async function doDismiss(form: FormData) {
  await requireRole("clinic");
  const ids = form.getAll("id").map(String);
  const jar = await cookies();
  jar.set(DISMISS_COOKIE, addDismissed(jar.get(DISMISS_COOKIE)?.value, ids), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/clinic",
    maxAge: DISMISS_DAYS * 86_400,
  });
}

export async function dismissNotices(form: FormData) {
  await doDismiss(form);
  redirect("/clinic");
}

export async function dismissNoticesQuiet(_prev: QuickState, form: FormData): Promise<QuickState> {
  await doDismiss(form);
  revalidatePath("/clinic");
  return null;
}

// A live job, or a draft or rejected one that was live before, can be closed. Closing keeps the record for candidates.
async function doClose(form: FormData) {
  await requireRole("clinic");
  const id = idFrom(form);
  const db = await supabaseServer();
  if (id && db) await db.from("jobs").update({ status: "closed" }).eq("id", id).in("status", ["live", "draft", "rejected"]);
  revalidatePath("/clinic");
  refreshJobPages();
  return "job-closed";
}

export async function closeJob(form: FormData) {
  redirect(`/clinic?notice=${await doClose(form)}`);
}

export async function closeJobQuiet(_prev: QuickState, form: FormData): Promise<QuickState> {
  return quiet(await doClose(form));
}

// Another 30 days for a job near the end of its run, or one that ended in the last 7 days. The wording was
// already approved, so it goes straight back up without review. The clinic is checked first, then the change is
// made on the server, because clinics cannot change a live or expired job themselves.
// Free while we launch. When paid posts start, this is where an extension will be charged (or counted against a pass).
async function doExtend(form: FormData) {
  const session = await requireRole("clinic");
  const id = idFrom(form);
  const employer = await getMyEmployer(session.userId);
  const admin = supabaseAdmin();
  if (!id || !employer || !admin) return "job-extend-failed";
  const { data: job } = await admin.from("jobs").select("id, status, expires_at, is_seeded, extended_count, province").eq("id", id).eq("employer_id", employer.id).maybeSingle();
  if (job && isQuebecJob(job)) return "job-extend-quebec";
  if (!job || !canExtend(job)) return "job-extend-blocked";
  const until = extendedUntil(job).toISOString();
  const { error } = await admin
    .from("jobs")
    .update({ status: "live", expires_at: until, extended_count: (job.extended_count ?? 0) + 1, last_extended_at: new Date().toISOString(), expiry_reminded_at: null })
    .eq("id", id)
    .eq("employer_id", employer.id)
    .in("status", ["live", "expired"]);
  if (error) return "job-extend-failed";
  revalidatePath("/clinic");
  refreshJobPages();
  return "job-extended";
}

export async function extendJob(form: FormData) {
  const id = idFrom(form);
  const key = await doExtend(form);
  // A success always lands on the dashboard. A problem goes back to the page the button was on (the job ending page, or the dashboard).
  const back = String(form.get("from") ?? "") === "ending" && id ? `/clinic/jobs/${id}/ending` : "/clinic";
  redirect(key === "job-extended" ? `/clinic?notice=${key}` : `${back}?notice=${key}`);
}

export async function extendJobQuiet(_prev: QuickState, form: FormData): Promise<QuickState> {
  return quiet(await doExtend(form));
}

async function doWithdraw(form: FormData) {
  await requireRole("clinic");
  const id = idFrom(form);
  const db = await supabaseServer();
  if (id && db) await db.from("jobs").update({ status: "draft" }).eq("id", id).eq("status", "in_review");
  revalidatePath("/clinic");
  return "job-withdrawn";
}

export async function withdrawJob(form: FormData) {
  redirect(`/clinic?notice=${await doWithdraw(form)}`);
}

export async function withdrawJobQuiet(_prev: QuickState, form: FormData): Promise<QuickState> {
  return quiet(await doWithdraw(form));
}

// Only a job that was never live and has no applications can be deleted. The database enforces this too.
// Anything else is closed instead, so candidates keep their record of applying.
async function doDelete(form: FormData) {
  await requireRole("clinic");
  const id = idFrom(form);
  const db = await supabaseServer();
  let removed = false;
  if (id && db) {
    const { data } = await db.from("jobs").delete().eq("id", id).in("status", ["draft", "rejected"]).is("posted_at", null).select("id");
    removed = Boolean(data?.length);
  }
  revalidatePath("/clinic");
  return removed ? "job-deleted" : "job-delete-blocked";
}

export async function deleteJob(form: FormData) {
  redirect(`/clinic?notice=${await doDelete(form)}`);
}

export async function deleteJobQuiet(_prev: QuickState, form: FormData): Promise<QuickState> {
  return quiet(await doDelete(form));
}

// Starts a new draft from an old job (one that has closed or expired), so it can be posted again
// without typing everything in again. The dates start fresh when it is approved.
export async function repostJob(form: FormData) {
  const session = await requireRole("clinic");
  const id = idFrom(form);
  const employer = await getMyEmployer(session.userId);
  const db = await supabaseServer();
  if (!id || !db || !employer) redirect("/clinic");
  const { data: old } = await db
    .from("jobs")
    .select(await withExpected("title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, pay_is_minimum, pay_days_per_week, pay_percent_min, pay_percent_max, pay_percent_of, tags_software, tags_equipment, tags_specialties, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, work_arrangement, territory, pay_extras"))
    .eq("id", id)
    .eq("employer_id", employer.id)
    .in("status", ["closed", "expired", "live"])
    .maybeSingle();
  if (!old) redirect("/clinic");
  const { data: copy, error } = await db.from("jobs").insert({ ...(old as unknown as Record<string, unknown>), employer_id: employer.id, status: "draft" }).select("id").single();
  if (error || !copy) {
    console.error("Repost failed:", error?.code, error?.message);
    redirect(`/clinic?notice=${/10 open jobs/.test(error?.message ?? "") ? "job-limit" : "job-repost-failed"}`);
  }
  revalidatePath("/clinic");
  redirect(`/clinic/jobs/${copy.id}`);
}
