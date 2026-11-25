"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import type { JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";
import { refreshJobPages } from "@/lib/job-cache";

const CV_BUCKET = "cvs";

// Lets a candidate or a clinic delete their own account and everything attached to it:
// profile, resume files, applications, and for a clinic its profile and jobs (the
// candidates keep their own record of applications they sent, migration 0044). It asks for the password again, and for the word DELETE.
// Admin accounts cannot be deleted this way.
export async function deleteAccount(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate", "clinic");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") return { errors: { confirm: "Type the word DELETE in capital letters to continue." }, error: "Type the word DELETE in capital letters to continue." };
  if (session.hasPassword && !password) return { errors: { password: "Enter your password." }, error: "Enter your password." };
  // Google sign in has no password to check, so we ask for the email address instead.
  if (!session.hasPassword && String(form.get("confirmEmail") ?? "").trim().toLowerCase() !== session.email.toLowerCase()) {
    return { errors: { confirmEmail: "Type your email address exactly as shown." }, error: "Type your email address exactly as shown." };
  }

  const db = await supabaseServer();
  const admin = supabaseAdmin();
  if (!db || !admin) return { error: NOT_CONNECTED };

  // Check it really is them, even if someone left a signed in screen open.
  if (session.hasPassword) {
    const { error: authError } = await db.auth.signInWithPassword({ email: session.email, password });
    if (authError) return { errors: { password: "That password doesn't match." }, error: "That password doesn't match." };
  }

  // A clinic owner with a team hands the clinic over first, so the team does not lose its jobs and applicants (migration 0045).
  if (session.role === "clinic") {
    const { data: owned } = await admin.from("employers").select("id").eq("owner_id", session.userId);
    const ownedIds = (owned ?? []).map((e) => e.id as string);
    const { count } = ownedIds.length ? await admin.from("employer_members").select("user_id", { count: "exact", head: true }).in("employer_id", ownedIds) : { count: 0 };
    if (count && count > 0) return { error: "Your clinic has other people on its team. Hand the clinic to one of them from Clinic team first, or remove them, then delete your account." };
  }

  // Collect every stored file that belongs to this account, and count what goes with it for the deletion record.
  const paths: string[] = [];
  let jobsCount = 0;
  let applicationsCount = 0;
  if (session.role === "candidate") {
    const { data: profile } = await admin.from("candidate_profiles").select("cv_path").eq("user_id", session.userId).maybeSingle();
    if (profile?.cv_path) paths.push(profile.cv_path);
    const { data: apps } = await admin.from("applications").select("cv_path").eq("candidate_id", session.userId);
    (apps ?? []).forEach((a) => a.cv_path && paths.push(a.cv_path));
    applicationsCount = apps?.length ?? 0;
  } else {
    // Every location this account owns (migration 0047).
    const { data: ownedLocations } = await admin.from("employers").select("id").eq("owner_id", session.userId);
    const locationIds = (ownedLocations ?? []).map((e) => e.id as string);
    if (locationIds.length) {
      const { data: jobs } = await admin.from("jobs").select("id").in("employer_id", locationIds);
      const jobIds = (jobs ?? []).map((j) => j.id);
      jobsCount = jobIds.length;
      if (jobIds.length) {
        const { data: apps } = await admin.from("applications").select("cv_path").in("job_id", jobIds);
        (apps ?? []).forEach((a) => a.cv_path && paths.push(a.cv_path));
        applicationsCount = apps?.length ?? 0;
        // The copy of each resume sent to this clinic is deleted with it. Candidates keep their own record of the application (migration
        // 0044), so it no longer points at the removed copy; the file name stays for their record.
        await admin.from("applications").update({ cv_path: null }).in("job_id", jobIds);
      }
    }
  }
  if (paths.length) await admin.storage.from(CV_BUCKET).remove(paths);

  // Deleting the account removes everything else with it (the database cascades).
  const { error } = await admin.auth.admin.deleteUser(session.userId);
  if (error) {
    console.error("Account deletion failed:", error.message);
    return { error: "We couldn't delete your account. Please try again, or email privacy@eyecarejobs.ca and we will do it for you." };
  }
  // A clinic's jobs went with it, so saved job pages are cleared (audit P1-10).
  if (session.role === "clinic") refreshJobPages();
  // A record that it happened, with no names or addresses.
  const { error: logError } = await admin.from("account_deletions").insert({ account_role: session.role, jobs_count: jobsCount, applications_count: applicationsCount });
  if (logError) console.error("Deletion record failed:", logError.code, logError.message);
  await db.auth.signOut();
  redirect("/goodbye");
}
