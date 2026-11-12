"use server";

import { applicantSnapshot } from "./application-details.ts";
import { APPLY_LIMIT_TEXT, MAX_APPLICATIONS_PER_DAY, applyWindowStart, overApplyLimit } from "@/lib/apply-limit";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { CV_MAX_BYTES, activeContent, cleanCoverLetter, detectCv, isClosed, safeFilename } from "@/lib/applications";
import { NOT_CONNECTED, withNext } from "@/lib/auth-copy";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import { newApplicationEmail } from "@/lib/clinic-emails";
import { cleanPrefs } from "@/lib/candidate-prefs";
import { FIELD_ROLES, PROVINCES, ROLE_CATEGORIES, type JobFormState } from "@/lib/jobs";
import { missingSentence, readyToApply } from "@/lib/profile-ready";
import { cleanStage } from "@/lib/career-stage";
import { notify } from "@/lib/notifications";
import { newApplicant } from "@/lib/notify-text";
import { canApplyForRole, canHaveFieldRoles, roleMismatchText } from "@/lib/role-fit";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CV_BUCKET = "cvs";
const EXPERIENCE = ["Under 1 year", "1 to 4 years", "5 to 9 years", "10 or more years"];

const text = (form: FormData, key: string, max = 200) => String(form.get(key) ?? "").trim().slice(0, max);

// Resumes live in a private bucket that nobody can read directly. It is made the first time it is needed.
async function ensureBucket(admin: NonNullable<ReturnType<typeof supabaseAdmin>>) {
  const { data } = await admin.storage.getBucket(CV_BUCKET);
  if (data) return true;
  const { error } = await admin.storage.createBucket(CV_BUCKET, {
    public: false,
    fileSizeLimit: CV_MAX_BYTES,
    allowedMimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  });
  if (error && !/already exists/i.test(error.message)) {
    console.error("Could not create the resume bucket:", error.message);
    return false;
  }
  return true;
}

export async function saveCandidateProfile(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate");
  const profession = text(form, "profession", 80);
  const provinces = form.getAll("licensedProvinces").map(String).filter((p) => (PROVINCES as readonly string[]).includes(p));
  const years = text(form, "yearsExperience", 30);
  const available = text(form, "availableFrom", 10);
  const phone = text(form, "phone", 30);

  const errors: Record<string, string> = {};
  if (!(ROLE_CATEGORIES as readonly string[]).includes(profession)) errors.profession = "Choose the role that fits you best.";
  if (years && !EXPERIENCE.includes(years)) errors.yearsExperience = "Choose one of the options.";
  if (available && !/^\d{4}-\d{2}-\d{2}$/.test(available)) errors.availableFrom = "Enter a date.";
  if (phone && !/^[\d\s().+\-]{7,30}$/.test(phone)) errors.phone = "Enter a phone number, or leave it blank.";
  const prefs = cleanPrefs(
    {
      homeCity: text(form, "homeCity", 80),
      homeProvince: text(form, "homeProvince", 40),
      radius: text(form, "radius", 4),
      extraProvinces: form.getAll("extraProvinces").map(String),
      employmentTypes: form.getAll("employmentTypes").map(String),
      otherRoles: form.getAll("otherRoles").map(String),
      openToField: form.get("openToField") === "on",
      minPay: text(form, "minPay", 20),
      payPeriod: text(form, "payPeriod", 10),
      practice: text(form, "practice", 12),
      softwareSkills: form.getAll("softwareSkills").map(String),
    },
    profession,
  );
  Object.assign(errors, prefs.errors);
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const row = { profession, licensed_provinces: provinces, years_experience: years || null, available_from: available || null, phone: phone || null, ...prefs.row };

  const { data: existing } = await db.from("candidate_profiles").select("user_id").eq("user_id", session.userId).maybeSingle();
  const { error } = existing
    ? await db.from("candidate_profiles").update(row).eq("user_id", session.userId)
    : await db.from("candidate_profiles").insert({ ...row, user_id: session.userId });
  if (error) {
    console.error("Candidate profile save failed:", error.code, error.message);
    return { error: "We couldn't save your profile. Please try again." };
  }
  revalidatePath("/candidate");
  revalidatePath("/candidate/profile");
  return { message: "Your profile is saved." };
}

// The first step page after a candidate's first sign in: an optional role, the field and supplier tick, and where they are in eye care.
// Skip saves nothing except that the page was shown. If migration 0037 has not been run yet, the new columns are left out so the answers
// that can be saved still are, and nobody is sent back to this page.
export async function saveFirstStep(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate");
  const skip = form.get("skip") === "1";
  const profession = skip ? "" : text(form, "profession", 80);
  if (profession && !(ROLE_CATEGORIES as readonly string[]).includes(profession)) return { errors: { profession: "Choose the role that fits you best." }, error: "Please check the highlighted answer." };
  const stage = skip ? null : cleanStage(text(form, "careerStage", 12));

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const { data: existing } = await db.from("candidate_profiles").select("user_id, pref_other_roles").eq("user_id", session.userId).maybeSingle();
  const base: Record<string, unknown> = {};
  if (profession) {
    const field = FIELD_ROLES as readonly string[];
    const kept = ((existing?.pref_other_roles as string[] | undefined) ?? []).filter((r) => !field.includes(r));
    base.profession = profession;
    base.pref_other_roles = form.get("openToField") === "on" && canHaveFieldRoles(profession) ? [...kept, ...FIELD_ROLES] : kept;
  }
  const extra: Record<string, unknown> = { start_seen_at: new Date().toISOString() };
  if (stage) extra.career_stage = stage;

  const write = (row: Record<string, unknown>) =>
    existing ? db.from("candidate_profiles").update(row).eq("user_id", session.userId) : db.from("candidate_profiles").insert({ ...row, user_id: session.userId });
  let { error } = await write({ ...base, ...extra });
  if (error && /career_stage|start_seen_at/.test(error.message)) {
    // The database has not been updated yet. Save what can be saved.
    ({ error } = Object.keys(base).length ? await write(base) : { error: null });
  }
  if (error) {
    console.error("First step save failed:", error.code, error.message);
    return { error: "We couldn't save that. Please try again, or choose Skip for now." };
  }
  revalidatePath("/candidate");
  revalidatePath("/candidate/profile");
  // Someone who came from a job goes on to the profile with the way back to that job still offered (audit P1-34).
  redirect(withNext("/candidate/profile", String(form.get("next") ?? "")));
}

export async function uploadCv(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate");
  const file = form.get("cv");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > CV_MAX_BYTES) return { error: "That file is too big. Please use a file under 3 MB." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectCv(bytes, file.name);
  if (!kind) return { error: "We can only accept a PDF or a Word document (.docx or .doc)." };
  // Macros, scripts and embedded programs are how most harmful files work, and a resume never needs them.
  if (activeContent(bytes, kind.ext)) return { error: "This file contains macros, scripts or embedded files, which we cannot accept. Please save your resume as a plain PDF and upload that." };

  const admin = supabaseAdmin();
  if (!admin || !(await ensureBucket(admin))) return { error: NOT_CONNECTED };

  const path = `${session.userId}/${randomUUID()}.${kind.ext}`;
  const { error: uploadError } = await admin.storage.from(CV_BUCKET).upload(path, bytes, { contentType: kind.contentType });
  if (uploadError) {
    console.error("Resume upload failed:", uploadError.message);
    return { error: "We couldn't save your resume. Please try again." };
  }

  const { data: old } = await admin.from("candidate_profiles").select("cv_path").eq("user_id", session.userId).maybeSingle();
  const { error: saveError } = await admin
    .from("candidate_profiles")
    .upsert({ user_id: session.userId, cv_path: path, cv_filename: safeFilename(file.name), cv_uploaded_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (saveError) {
    console.error("Resume save failed:", saveError.code, saveError.message);
    await admin.storage.from(CV_BUCKET).remove([path]);
    return { error: "We couldn't save your resume. Please try again." };
  }
  if (old?.cv_path) await admin.storage.from(CV_BUCKET).remove([old.cv_path]);
  revalidatePath("/candidate/profile");
  return { message: "Your resume is saved." };
}

export async function deleteCv() {
  const session = await requireRole("candidate");
  const admin = supabaseAdmin();
  if (admin) {
    const { data } = await admin.from("candidate_profiles").select("cv_path").eq("user_id", session.userId).maybeSingle();
    if (data?.cv_path) await admin.storage.from(CV_BUCKET).remove([data.cv_path]);
    await admin.from("candidate_profiles").update({ cv_path: null, cv_filename: null, cv_uploaded_at: null }).eq("user_id", session.userId);
  }
  revalidatePath("/candidate/profile");
  redirect("/candidate/profile?notice=cv-deleted");
}

// Sends an application. This runs on the server and checks everything itself, so nobody can
// apply to a job that is not live, apply twice, or send someone else's resume.
export async function applyToJob(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate");
  const jobId = String(form.get("jobId") ?? "");
  if (!UUID.test(jobId)) return { error: "We couldn't find that job." };
  if (form.get("agree") !== "on") return { errors: { agree: "Please tick the box to send your application." } };
  const coverLetter = cleanCoverLetter(form.get("coverLetter"));
  const keepDetails = form.get("keepDetails") === "on";

  const admin = supabaseAdmin();
  if (!admin || !(await ensureBucket(admin))) return { error: NOT_CONNECTED };

  const { data: job } = await admin
    .from("jobs")
    .select("id, title, role_category, status, expires_at, apply_method, employer_id, city, province, employers(clinic_name)")
    .eq("id", jobId)
    .maybeSingle();
  const clinicName = (job?.employers as unknown as { clinic_name: string } | null)?.clinic_name;
  if (!job || job.status !== "live" || new Date(job.expires_at) <= new Date() || !clinicName) return { error: "This job is no longer open for applications." };
  if (job.apply_method !== "kestrel") return { error: "This job takes applications on the clinic's own website." };

  const { data: profile } = await admin.from("candidate_profiles").select("profession, pref_other_roles, licensed_provinces, years_experience, available_from, phone, cv_path, cv_filename, home_city, home_province").eq("user_id", session.userId).maybeSingle();
  if (!profile || !readyToApply(profile)) return { error: `Please add ${missingSentence(profile ?? null)} to your profile first.` };
  if (!profile.profession || !profile.cv_path) return { error: "Please finish your profile and save your resume first." };
  // The role on the profile has to fit the job (lib/role-fit.ts). The job page and the apply page say so first, and this stops it from the server too.
  if (!canApplyForRole(profile.profession, profile.pref_other_roles, job.role_category)) return { error: roleMismatchText(profile.profession, job.role_category) };

  // No more than 30 applications in 24 hours (lib/apply-limit.ts). If the count cannot be read, the application goes ahead.
  const now = new Date();
  const { data: recent, error: recentError } = await admin
    .from("applications")
    .select("created_at")
    .eq("candidate_id", session.userId)
    .gt("created_at", applyWindowStart(now).toISOString())
    .limit(MAX_APPLICATIONS_PER_DAY + 1);
  if (recentError) console.error("Counting recent applications failed:", recentError.code, recentError.message);
  else if (overApplyLimit((recent ?? []).map((row) => String(row.created_at)), now)) return { error: APPLY_LIMIT_TEXT };

  const { data: created, error } = await admin
    .from("applications")
    .insert({
      job_id: job.id,
      candidate_id: session.userId,
      cover_letter: coverLetter || null,
      keep_details: keepDetails,
      applicant: applicantSnapshot({ name: session.fullName || session.email, email: session.email }, profile),
      job_title: job.title,
      clinic_name: clinicName,
      job_location: `${job.city}, ${job.province}`,
    })
    .select("id")
    .single();
  if (error || !created) {
    if (error?.code === "23505") return { error: "You have already applied to this job. You can follow it under My applications." };
    console.error("Application failed:", error?.code, error?.message);
    return { error: "We couldn't send your application. Please try again." };
  }

  // Keep a copy of the resume with the application, so it still opens if the candidate replaces theirs later.
  const ext = profile.cv_path.split(".").pop() ?? "pdf";
  const copyPath = `applications/${created.id}/cv.${ext}`;
  const { error: copyError } = await admin.storage.from(CV_BUCKET).copy(profile.cv_path, copyPath);
  if (copyError) {
    console.error("Resume copy failed:", copyError.message);
    await admin.from("applications").delete().eq("id", created.id);
    return { error: "We couldn't attach your resume. Please try again." };
  }
  await admin.from("applications").update({ cv_path: copyPath, cv_filename: profile.cv_filename }).eq("id", created.id);
  // The draft is no longer needed. If asked, the letter is kept as a template for next time (up to 5).
  await admin.from("application_drafts").delete().eq("user_id", session.userId).eq("job_id", job.id);
  const letterName = String(form.get("letterName") ?? "").trim().slice(0, 80);
  if (form.get("saveLetter") === "yes" && coverLetter && letterName) {
    const { error: letterError } = await admin.from("cover_letter_templates").upsert({ user_id: session.userId, name: letterName, body: coverLetter }, { onConflict: "user_id,name" });
    if (letterError) console.error("Letter template save failed:", letterError.code, letterError.message);
  }
  await admin.from("application_events").insert({ application_id: created.id, status: "applied" });

  // Tell the clinic in its inbox, and by email below, without putting the candidate's details in either.
  const { data: owner } = await admin.from("employers").select("owner_id").eq("id", job.employer_id).maybeSingle();
  await notify(admin, owner?.owner_id, newApplicant({ jobTitle: job.title, applicationId: created.id }));
  const { data: contact } = await admin.from("employer_contacts").select("*").eq("employer_id", job.employer_id).maybeSingle();
  // Clinics who chose a summary (every 2 to 3 days, or weekly) or no email get nothing here. The daily job sends their summary.
  if (contact?.notify_email && contact.notify_new_applications !== false && (contact.notify_frequency ?? "each") === "each") {
    await sendEmail({ to: contact.notify_email, ...newApplicationEmail({ title: job.title, applicationId: created.id }) });
  }

  revalidatePath("/candidate/applications");
  redirect(`/candidate/applications/${created.id}?notice=applied`);
}

export async function withdrawApplication(form: FormData) {
  const session = await requireRole("candidate");
  const id = String(form.get("id") ?? "");
  const admin = supabaseAdmin();
  if (UUID.test(id) && admin) {
    const { data } = await admin.from("applications").select("status").eq("id", id).eq("candidate_id", session.userId).maybeSingle();
    if (data && !isClosed(data.status)) {
      await admin.from("applications").update({ status: "withdrawn", status_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
      await admin.from("application_events").insert({ application_id: id, status: "withdrawn" });
    }
  }
  revalidatePath("/candidate/applications");
  redirect(`/candidate/applications/${id}?notice=withdrawn`);
}
