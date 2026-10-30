"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";
import { cleanClinic, cleanJob, parseMoney, validateClinic, validateJob, type JobFormState } from "@/lib/jobs";
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
    status: submit ? "in_review" : "draft",
  };

  const id = idFrom(form);
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

  revalidatePath("/clinic");
  redirect(`/clinic?notice=${submit ? "job-submitted" : "job-saved"}`);
}

// Live job: close it. Job in review: take it back to a draft so it can be changed.
export async function closeJob(form: FormData) {
  await requireRole("clinic");
  const id = idFrom(form);
  const db = await supabaseServer();
  if (id && db) await db.from("jobs").update({ status: "closed" }).eq("id", id).eq("status", "live");
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
  if (id && db) await db.from("jobs").delete().eq("id", id).in("status", ["draft", "rejected"]);
  revalidatePath("/clinic");
  redirect("/clinic?notice=job-deleted");
}
