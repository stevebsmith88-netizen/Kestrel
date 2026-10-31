"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import type { JobFormState } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";

const CV_BUCKET = "cvs";

// Lets a candidate or a clinic delete their own account and everything attached to it:
// profile, CV files, applications, and for a clinic its profile, jobs and the
// applications they received. It asks for the password again, and for the word DELETE.
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
    const { data: employer } = await admin.from("employers").select("id").eq("owner_id", session.userId).maybeSingle();
    if (employer) {
      const { data: jobs } = await admin.from("jobs").select("id").eq("employer_id", employer.id);
      const jobIds = (jobs ?? []).map((j) => j.id);
      jobsCount = jobIds.length;
      if (jobIds.length) {
        const { data: apps } = await admin.from("applications").select("cv_path").in("job_id", jobIds);
        (apps ?? []).forEach((a) => a.cv_path && paths.push(a.cv_path));
        applicationsCount = apps?.length ?? 0;
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
  // A record that it happened, with no names or addresses.
  const { error: logError } = await admin.from("account_deletions").insert({ account_role: session.role, jobs_count: jobsCount, applications_count: applicationsCount });
  if (logError) console.error("Deletion record failed:", logError.code, logError.message);
  await db.auth.signOut();
  redirect("/goodbye");
}
