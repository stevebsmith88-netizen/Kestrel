"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";
import { notifyAdmin } from "@/lib/notify-admin";
import { cleanClinic, cleanJob, parseMoney, validateClinic, validateJob, type JobFormState } from "@/lib/jobs";
import { updateThenInsert } from "@/lib/save-helpers";
import { supabaseServer } from "@/lib/supabase/server";
import { NOT_CONNECTED } from "@/lib/auth-copy";

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
  });
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
  } else {
    const { data, error } = await db.from("employers").insert({ ...row, owner_id: session.userId }).select("id").single();
    if (error || !data) {
      console.error("Clinic create failed:", error?.code, error?.message);
      return { error: "We couldn't save your clinic profile. Please try again." };
    }
    employerId = data.id;
  }

  const { error: contactError } = await db.from("employer_contacts").upsert({ employer_id: employerId, notify_email: clinic.notifyEmail }, { onConflict: "employer_id" });
  if (contactError) {
    console.error("Clinic contact save failed:", contactError.code, contactError.message);
    return { error: "We saved your profile but not your alert email. Please try again." };
  }

  revalidatePath("/clinic");
  if (!existing) redirect("/clinic?notice=profile-created");
  return { message: "Your clinic profile is saved." };
}

// What a template keeps from a job: everything except the status and the two questions that must be answered fresh.
const templateFields = (row: {
  title: string; role_category: string | null; employment_type: string | null; province: string | null; city: string | null;
  pay_period: string | null; pay_min: number | null; pay_max: number | null; description: string | null; apply_method: string;
  apply_url: string | null; work_arrangement: string; territory: string | null; pay_extras: string | null;
}) => ({
  title: row.title, role_category: row.role_category, employment_type: row.employment_type, province: row.province, city: row.city,
  pay_period: row.pay_period, pay_min: row.pay_min, pay_max: row.pay_max, description: row.description, apply_method: row.apply_method,
  apply_url: row.apply_url, work_arrangement: row.work_arrangement, territory: row.territory, pay_extras: row.pay_extras,
});

export async function saveJob(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("clinic");
  const employer = await getMyEmployer(session.userId);
  if (!employer) redirect("/clinic/profile");

  const submit = String(form.get("intent") ?? "") === "submit";
  const job = cleanJob({
    title: field(form, "title"),
    roleCategory: field(form, "roleCategory"),
    employmentType: field(form, "employmentType"),
    province: field(form, "province"),
    city: field(form, "city"),
    payPeriod: field(form, "payPeriod"),
    payMin: field(form, "payMin"),
    payMax: field(form, "payMax"),
    existingVacancy: field(form, "existingVacancy"),
    usesAi: field(form, "usesAi"),
    description: field(form, "description"),
    applyMethod: field(form, "applyMethod"),
    applyUrl: field(form, "applyUrl"),
    workArrangement: field(form, "workArrangement"),
    territory: field(form, "territory"),
    payExtras: field(form, "payExtras"),
  });
  const errors = validateJob(job, submit);
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };

  const row = {
    title: job.title,
    role_category: job.roleCategory || null,
    employment_type: job.employmentType || null,
    province: job.province || null,
    city: job.city || null,
    pay_period: job.payPeriod || null,
    pay_min: parseMoney(job.payMin),
    pay_max: parseMoney(job.payMax),
    is_existing_vacancy: job.existingVacancy === "yes" ? true : job.existingVacancy === "no" ? false : null,
    uses_ai_screening: job.usesAi === "yes" ? true : job.usesAi === "no" ? false : null,
    description: job.description || null,
    apply_method: job.applyMethod,
    apply_url: job.applyMethod === "external" ? job.applyUrl || null : null,
    work_arrangement: job.workArrangement,
    territory: job.workArrangement === "field" ? job.territory || null : null,
    pay_extras: job.payExtras || null,
    status: submit ? "in_review" : "draft",
  };

  const id = idFrom(form);
  // A live job can be edited, but only by sending the changes to be read again. It is offline until they are approved.
  let wasLive = false;
  if (id) {
    const { data: current } = await db.from("jobs").select("status").eq("id", id).maybeSingle();
    wasLive = current?.status === "live";
    if (wasLive && !submit) return { error: "A live job can't be saved as a draft. Send your changes for review, or close the job." };
  }
  if (id) {
    const { data, error } = await db.from("jobs").update(row).eq("id", id).select("id");
    if (error || !data?.length) {
      console.error("Job update failed:", error?.code, error?.message);
      return { error: "We couldn't save this job. It may already be in review or live." };
    }
  } else {
    const { error } = await db.from("jobs").insert({ ...row, employer_id: employer.id });
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
  revalidatePath("/jobs");
  redirect(`/clinic?notice=${wasLive ? "job-edited" : submit ? "job-submitted" : "job-saved"}${savedTemplate ? "&template=1" : templateFailed ? "&template=failed" : ""}`);
}

// Live job: close it. Job in review: take it back to a draft so it can be changed.
export async function closeJob(form: FormData) {
  await requireRole("clinic");
  const id = idFrom(form);
  const db = await supabaseServer();
  // A live job, or a draft or rejected one that was live before, can be closed. Closing keeps the record for candidates.
  if (id && db) await db.from("jobs").update({ status: "closed" }).eq("id", id).in("status", ["live", "draft", "rejected"]);
  revalidatePath("/clinic");
  redirect("/clinic?notice=job-closed");
}

export async function withdrawJob(form: FormData) {
  await requireRole("clinic");
  const id = idFrom(form);
  const db = await supabaseServer();
  if (id && db) await db.from("jobs").update({ status: "draft" }).eq("id", id).eq("status", "in_review");
  revalidatePath("/clinic");
  redirect("/clinic?notice=job-withdrawn");
}

export async function deleteJob(form: FormData) {
  await requireRole("clinic");
  const id = idFrom(form);
  const db = await supabaseServer();
  // Only a job that was never live and has no applications can be deleted. The database enforces this too.
  // Anything else is closed instead, so candidates keep their record of applying.
  let removed = false;
  if (id && db) {
    const { data } = await db.from("jobs").delete().eq("id", id).in("status", ["draft", "rejected"]).is("posted_at", null).select("id");
    removed = Boolean(data?.length);
  }
  revalidatePath("/clinic");
  redirect(`/clinic?notice=${removed ? "job-deleted" : "job-delete-blocked"}`);
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
    .select("title, role_category, employment_type, province, city, pay_period, pay_min, pay_max, is_existing_vacancy, uses_ai_screening, description, apply_method, apply_url, work_arrangement, territory, pay_extras")
    .eq("id", id)
    .eq("employer_id", employer.id)
    .in("status", ["closed", "expired", "live"])
    .maybeSingle();
  if (!old) redirect("/clinic");
  const { data: copy, error } = await db.from("jobs").insert({ ...old, employer_id: employer.id, status: "draft" }).select("id").single();
  if (error || !copy) {
    console.error("Repost failed:", error?.code, error?.message);
    redirect(`/clinic?notice=${/10 open jobs/.test(error?.message ?? "") ? "job-limit" : "job-repost-failed"}`);
  }
  revalidatePath("/clinic");
  redirect(`/clinic/jobs/${copy.id}`);
}
