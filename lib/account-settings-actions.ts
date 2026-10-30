"use server";

import { revalidatePath } from "next/cache";
import { cleanName, fullName, validateEmailChange, validateName } from "@/lib/account";
import { requireRole } from "@/lib/auth";
import { MARKETING_CONSENT_TEXT, NOT_CONNECTED } from "@/lib/auth-copy";
import type { JobFormState } from "@/lib/jobs";
import { suppress } from "@/lib/suppression";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseServer } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

// Change your own name. It shows on your account from now on. Applications you have already sent keep the name you used then.
export async function updateName(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate", "clinic");
  const first = cleanName(form.get("firstName"));
  const last = cleanName(form.get("lastName"));
  const errors = validateName(first, last);
  if (Object.keys(errors).length) return { errors, error: errors.firstName };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const { error } = await db.from("profiles").update({ first_name: first, last_name: last, full_name: fullName(first, last) }).eq("id", session.userId);
  if (error) {
    console.error("Name change failed:", error.code, error.message);
    return { error: "We couldn't save your name. Please try again." };
  }
  await db.auth.updateUser({ data: { first_name: first, last_name: last, full_name: fullName(first, last) } });
  revalidatePath("/", "layout");
  return { message: "Your name is saved." };
}

// Change your sign in email. It needs your password, and Supabase then asks you to confirm from your old address and the new one,
// so nobody who finds a signed in screen can take over the account.
export async function requestEmailChange(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate", "clinic");
  if (!session.hasPassword) return { error: "You sign in with Google, so your email address comes from your Google account." };
  const next = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const errors = validateEmailChange(session.email, next, password);
  if (Object.keys(errors).length) return { errors, error: errors.email ?? errors.password };

  const db = await supabaseServer();
  if (!db) return { error: NOT_CONNECTED };
  const { error: authError } = await db.auth.signInWithPassword({ email: session.email, password });
  if (authError) return { errors: { password: "That password doesn't match." }, error: "That password doesn't match." };

  const { error } = await db.auth.updateUser({ email: next }, { emailRedirectTo: `${SITE}/auth/callback?next=${encodeURIComponent("/account?email=confirmed")}` });
  if (error) {
    if (error.code === "email_exists") return { errors: { email: "Another account already uses that address." }, error: "Another account already uses that address." };
    if (error.code === "over_email_send_rate_limit") return { error: "We have sent a few emails just now. Please wait a few minutes and try again." };
    console.error("Email change failed:", error.code, error.message);
    return { error: "We couldn't start that change. Please check the address and try again." };
  }
  return { message: `We have sent a link to your current address and one to ${next}. Open both to finish the change. Until then, keep signing in with your current address.` };
}

// Which emails you get. Emails about your security (password resets, changing your email) and about your account
// (such as a job taken down) are always sent.
export async function savePreferences(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("candidate", "clinic");
  const admin = supabaseAdmin();
  if (!admin) return { error: NOT_CONNECTED };
  const wantsNews = form.get("news") === "yes";
  const now = new Date().toISOString();

  const { data: profile } = await admin.from("profiles").select("marketing_consent, unsubscribed_at").eq("id", session.userId).maybeSingle();
  const hadNews = Boolean(profile?.marketing_consent) && !profile?.unsubscribed_at;
  if (wantsNews && !hadNews) {
    // They are asking to hear from us again, so the wording they agreed to is saved with the date, as at sign up.
    await admin.from("profiles").update({ marketing_consent: true, marketing_consent_text: MARKETING_CONSENT_TEXT, marketing_consent_at: now, unsubscribed_at: null }).eq("id", session.userId);
    await admin.from("email_suppressions").delete().eq("address", session.email.toLowerCase()).eq("reason", "unsubscribed");
  } else if (!wantsNews && hadNews) {
    await admin.from("profiles").update({ marketing_consent: false, unsubscribed_at: now }).eq("id", session.userId);
    await suppress(session.email, "unsubscribed", "account settings");
  }

  if (session.role === "candidate") {
    await admin.from("profiles").update({ notify_application_updates: form.get("applicationUpdates") === "yes" }).eq("id", session.userId);
  } else {
    const { data: employer } = await admin.from("employers").select("id").eq("owner_id", session.userId).maybeSingle();
    if (employer) {
      await admin.from("employer_contacts").update({ notify_new_applications: form.get("newApplicants") === "yes", notify_reminders: form.get("reminders") === "yes" }).eq("employer_id", employer.id);
    }
  }
  revalidatePath("/account");
  return { message: "Your email choices are saved." };
}
