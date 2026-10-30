"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { CV_MAX_BYTES, cleanCoverLetter, detectCv, isClosed, safeFilename } from "@/lib/applications";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import { PROVINCES, ROLE_CATEGORIES, type JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CV_BUCKET = "cvs";
const EXPERIENCE = ["Under 1 year", "1 to 4 years", "5 to 9 years", "10 or more years"];

const text = (form: FormData, key: string, max = 200) => String(form.get(key) ?? "").trim().slice(0, max);

// CVs live in a private bucket that nobody can read directly. It is made the first time it is needed.
async function ensureBucket(admin: NonNullable<ReturnType<typeof supabaseAdmin>>) {
  const { data } = await admin.storage.getBucket(CV_BUCKET);
  if (data) return true;
  const { error } = await admin.storage.createBucket(CV_BUCKET, {
    public: false,
    fileSizeLimit: CV_MAX_BYTES,
    allowedMimeTypes: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  });
  if (error && !/already exists/i.test(error.message)) {
    console.error("Could not create the CV bucket:", error.message);
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
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const row = { profession, licensed_provinces: provinces, years_experience: years || null, available_from: available || null, phone: phone || null };

  const { data: existing } = await db.from("candidate_profiles").select("user_id").eq("user_id", session.userId).maybeSingle();
  const { error } = existing
    ? await db.from("candidate_profiles").update(row).eq("user_id", session.userId)
    : await db.from("candidate_profiles").insert({ ...row, user_id: session.userId });
  if (error) {
    console.error("Candidate profile save failed:", error.code, error.message);
    return { error: "We couldn't save your profile. Please try again." };
  }
  revalidatePath("/candidate");
  return { message: "Your profile is saved." };
}

export async function uploadCv(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate");
  const file = form.get("cv");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > CV_MAX_BYTES) return { error: "That file is too big. Please use a file under 3 MB." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectCv(bytes, file.name);
  if (!kind) return { error: "We can only accept a PDF or a Word document (.docx or .doc)." };

  const admin = supabaseAdmin();
  if (!admin || !(await ensureBucket(admin))) return { error: NOT_CONNECTED };

  const path = `${session.userId}/${randomUUID()}.${kind.ext}`;
  const { error: uploadError } = await admin.storage.from(CV_BUCKET).upload(path, bytes, { contentType: kind.contentType });
  if (uploadError) {
    console.error("CV upload failed:", uploadError.message);
    return { error: "We couldn't save your CV. Please try again." };
  }

  const { data: old } = await admin.from("candidate_profiles").select("cv_path").eq("user_id", session.userId).maybeSingle();
  const { error: saveError } = await admin
    .from("candidate_profiles")
    .upsert({ user_id: session.userId, cv_path: path, cv_filename: safeFilename(file.name), cv_uploaded_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (saveError) {
    console.error("CV save failed:", saveError.code, saveError.message);
    await admin.storage.from(CV_BUCKET).remove([path]);
    return { error: "We couldn't save your CV. Please try again." };
  }
  if (old?.cv_path) await admin.storage.from(CV_BUCKET).remove([old.cv_path]);
  revalidatePath("/candidate/profile");
  return { message: "Your CV is saved." };
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
// apply to a job that is not live, apply twice, or send someone else's CV.
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
    .select("id, title, status, expires_at, apply_method, employer_id, city, province, employers(clinic_name)")
    .eq("id", jobId)
    .maybeSingle();
  const clinicName = (job?.employers as unknown as { clinic_name: string } | null)?.clinic_name;
  if (!job || job.status !== "live" || new Date(job.expires_at) <= new Date() || !clinicName) return { error: "This job is no longer open for applications." };
  if (job.apply_method !== "kestrel") return { error: "This job takes applications on the clinic's own website." };

  const { data: profile } = await admin.from("candidate_profiles").select("profession, licensed_provinces, years_experience, available_from, phone, cv_path, cv_filename").eq("user_id", session.userId).maybeSingle();
  if (!profile?.cv_path || !profile.profession) return { error: "Please finish your profile and save your CV first." };

  const { data: created, error } = await admin
    .from("applications")
    .insert({
      job_id: job.id,
      candidate_id: session.userId,
      cover_letter: coverLetter || null,
      keep_details: keepDetails,
      applicant: {
        name: session.fullName || session.email,
        email: session.email,
        phone: profile.phone,
        profession: profile.profession,
        licensed_provinces: profile.licensed_provinces,
        years_experience: profile.years_experience,
        available_from: profile.available_from,
      },
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

  // Keep a copy of the CV with the application, so it still opens if the candidate replaces theirs later.
  const ext = profile.cv_path.split(".").pop() ?? "pdf";
  const copyPath = `applications/${created.id}/cv.${ext}`;
  const { error: copyError } = await admin.storage.from(CV_BUCKET).copy(profile.cv_path, copyPath);
  if (copyError) {
    console.error("CV copy failed:", copyError.message);
    await admin.from("applications").delete().eq("id", created.id);
    return { error: "We couldn't attach your CV. Please try again." };
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

  // Tell the clinic, without putting the candidate's details in the email.
  const { data: contact } = await admin.from("employer_contacts").select("notify_email, notify_new_applications").eq("employer_id", job.employer_id).maybeSingle();
  if (contact?.notify_email && contact.notify_new_applications !== false) {
    const mail = emailLayout({
      heading: "A new application",
      paragraphs: [`Someone has applied for ${job.title}. Open it to read their cover letter and CV.`],
      buttonText: "Open the application",
      buttonUrl: `${SITE_URL}/clinic/applications/${created.id}`,
    });
    await sendEmail({ to: contact.notify_email, subject: `New application for ${job.title}`, ...mail });
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
