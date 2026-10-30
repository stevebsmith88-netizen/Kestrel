"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { emailMatchesWebsite, hashToken, hostOf, newToken, tokenMatches, validateClaim } from "@/lib/claims";
import { SITE_URL, emailLayout, sendEmail } from "@/lib/email";
import type { JobFormState } from "@/lib/jobs";
import { notifyAdmin } from "@/lib/notify-admin";
import { getLiveJob } from "@/lib/public-jobs";
import { supabaseAdmin } from "@/lib/supabase-server";
import { NOT_CONNECTED } from "@/lib/auth-copy";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (form: FormData, key: string, max = 200) => String(form.get(key) ?? "").trim().slice(0, max);
const DAY = 24 * 60 * 60 * 1000;

// A clinic signed in to a clinic account asks to claim a listing we found on its website.
// Everything is checked on the server. A claim is confirmed by a link sent to an address at the
// clinic's own website (or checked by a person), and then approved by an admin.
export async function startClaim(_prev: JobFormState, form: FormData): Promise<JobFormState> {
  const session = await requireRole("clinic");
  const jobId = text(form, "jobId", 60);
  const input = {
    workEmail: text(form, "workEmail", 254).toLowerCase(),
    role: text(form, "role", 40),
    authorised: form.get("authorised") === "yes",
    manual: form.get("manual") === "yes",
    note: String(form.get("note") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 1000),
  };
  const errors = validateClaim(input);
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };

  const admin = supabaseAdmin();
  if (!admin) return { error: NOT_CONNECTED };
  const job = UUID.test(jobId) ? await getLiveJob(jobId) : null;
  if (!job) return { error: "We couldn't find that listing. It may have been removed." };
  const { data: employer } = await admin.from("employers").select("id, clinic_name, website, claimed, owner_id").eq("id", job.employer_id).maybeSingle();
  if (!employer || employer.claimed || employer.owner_id) return { error: "This listing has already been claimed." };

  // A clinic account holds one clinic profile.
  const { data: mine } = await admin.from("employers").select("id").eq("owner_id", session.userId).maybeSingle();
  if (mine) return { error: "Your account already has a clinic profile, so it cannot take over another one. Please email hello@eyecarejobs.ca and we will sort it out together." };

  const { count } = await admin.from("listing_claims").select("id", { count: "exact", head: true }).eq("user_id", session.userId).gte("created_at", new Date(Date.now() - DAY).toISOString());
  if ((count ?? 0) >= 5) return { error: "You have made several claims today. Please try again tomorrow, or email hello@eyecarejobs.ca." };

  const { data: open } = await admin.from("listing_claims").select("id, status").eq("employer_id", employer.id).eq("user_id", session.userId).in("status", ["pending_email", "pending_review"]).maybeSingle();
  if (open?.status === "pending_review") return { message: "You have already sent a claim for this listing. Our team is looking at it and will email you, usually within 1 business day." };
  // A new link replaces an unconfirmed one.
  if (open) await admin.from("listing_claims").update({ status: "expired" }).eq("id", open.id);

  const emailCheck = !input.manual && emailMatchesWebsite(input.workEmail, employer.website);
  if (!input.manual && !emailCheck) {
    const host = hostOf(employer.website);
    return {
      errors: { workEmail: host ? `Please use an address at ${host}, or tick the box below if you do not have one.` : "We do not have the clinic's website, so a person will need to check your claim. Tick the box below." },
      error: "We could not match that email address to the clinic's website.",
    };
  }

  const token = input.manual ? null : newToken();
  const { data: claim, error } = await admin
    .from("listing_claims")
    .insert({
      employer_id: employer.id,
      user_id: session.userId,
      claimant_name: session.fullName,
      claimant_email: input.workEmail,
      role_at_clinic: input.role,
      method: input.manual ? "manual" : "email",
      note: input.note || null,
      status: input.manual ? "pending_review" : "pending_email",
      token_hash: token ? hashToken(token) : null,
      token_expires_at: token ? new Date(Date.now() + 2 * DAY).toISOString() : null,
    })
    .select("id")
    .single();
  if (error || !claim) {
    console.error("Claim failed:", error?.code, error?.message);
    return { error: "We couldn't save your claim. Please try again." };
  }

  if (input.manual) {
    await notifyAdmin("A clinic would like to claim a listing", [`${employer.clinic_name}`, `${session.fullName} (${input.role}) wrote: ${input.note}`], "/admin/claims");
    return { message: "Thank you. Our team will check your claim by hand and email you, usually within 1 business day." };
  }

  const mail = emailLayout({
    heading: "Confirm your claim",
    paragraphs: [
      `You asked to claim the ${job.title} listing for ${employer.clinic_name} on Kestrel. Press the button to confirm that this email address is yours. The link works for 2 days.`,
      "If this wasn't you, you can ignore this email and nothing will happen.",
    ],
    buttonText: "Confirm my claim",
    buttonUrl: `${SITE_URL}/claim/verify?c=${claim.id}&t=${token}`,
  });
  await sendEmail({ to: input.workEmail, subject: "Confirm your claim on Kestrel", ...mail });
  return { message: `We have sent a link to ${input.workEmail}. Open it to confirm that you work at ${employer.clinic_name}.` };
}

// The person presses the button in the email. Only the same signed in account can confirm it.
export async function verifyClaim(form: FormData) {
  const session = await requireRole("clinic");
  const id = text(form, "c", 60);
  const token = text(form, "t", 100);
  const admin = supabaseAdmin();
  if (!UUID.test(id) || !admin) redirect("/claim/verify?problem=1");
  const { data: claim } = await admin.from("listing_claims").select("id, user_id, employer_id, claimant_name, claimant_email, role_at_clinic, status, token_hash, token_expires_at").eq("id", id).maybeSingle();
  const valid = claim && claim.user_id === session.userId && claim.status === "pending_email" && tokenMatches(claim.token_hash, token) && claim.token_expires_at && new Date(claim.token_expires_at) > new Date();
  if (!claim || !valid) redirect("/claim/verify?problem=1");
  await admin.from("listing_claims").update({ status: "pending_review", verified_at: new Date().toISOString(), token_hash: null, token_expires_at: null }).eq("id", claim.id);
  const { data: employer } = await admin.from("employers").select("clinic_name").eq("id", claim.employer_id).maybeSingle();
  await notifyAdmin("A clinic has confirmed a claim", [`${employer?.clinic_name ?? "A clinic"}`, `${claim.claimant_name} (${claim.role_at_clinic}) confirmed ${claim.claimant_email}.`], "/admin/claims");
  redirect("/claim/verify?done=1");
}

// Admin: approve a claim. The clinic becomes the owner of the profile and its listing.
export async function approveClaim(form: FormData) {
  await requireRole("admin");
  const id = text(form, "id", 60);
  const admin = supabaseAdmin();
  if (!UUID.test(id) || !admin) redirect("/admin/claims?notice=error");
  const { data: claim } = await admin.from("listing_claims").select("id, user_id, employer_id, claimant_email").eq("id", id).eq("status", "pending_review").maybeSingle();
  if (!claim) redirect("/admin/claims?notice=error");

  const { data: mine } = await admin.from("employers").select("id").eq("owner_id", claim.user_id).maybeSingle();
  if (mine) redirect("/admin/claims?notice=has-clinic");

  // Only an unclaimed listing can be claimed, even if two claims are approved at once.
  const { data: taken } = await admin.from("employers").update({ owner_id: claim.user_id, claimed: true }).eq("id", claim.employer_id).eq("claimed", false).select("id, clinic_name");
  if (!taken?.length) redirect("/admin/claims?notice=taken");

  await admin.from("employer_contacts").upsert({ employer_id: claim.employer_id, notify_email: claim.claimant_email }, { onConflict: "employer_id" });
  const now = new Date().toISOString();
  await admin.from("listing_claims").update({ status: "approved", decided_at: now }).eq("id", claim.id);
  await admin.from("listing_claims").update({ status: "rejected", decided_at: now, decision_note: "Another claim for this listing was approved." }).eq("employer_id", claim.employer_id).in("status", ["pending_email", "pending_review"]);

  const mail = emailLayout({
    heading: "Your listing is yours",
    paragraphs: [
      `Good news. Your claim for ${taken[0].clinic_name} is approved. The listing is now marked as yours, and applications will arrive in your dashboard.`,
      "Please review your clinic profile first, and add anything the listing is missing, such as your pay range. A job that is already live cannot be edited, so if you would like to change it, close it and post it again with your own wording.",
    ],
    buttonText: "Open my clinic profile",
    buttonUrl: `${SITE_URL}/clinic/profile`,
  });
  await sendEmail({ to: claim.claimant_email, subject: "Your Kestrel listing is approved", ...mail });
  revalidatePath("/admin/claims");
  revalidatePath("/jobs");
  redirect("/admin/claims?notice=approved");
}

export async function rejectClaim(form: FormData) {
  await requireRole("admin");
  const id = text(form, "id", 60);
  const note = String(form.get("note") ?? "").trim().slice(0, 1000);
  const admin = supabaseAdmin();
  if (!UUID.test(id) || !admin) redirect("/admin/claims?notice=error");
  if (!note) redirect("/admin/claims?notice=need-note");
  const { data: claim } = await admin.from("listing_claims").update({ status: "rejected", decided_at: new Date().toISOString(), decision_note: note }).eq("id", id).eq("status", "pending_review").select("claimant_email");
  if (!claim?.length) redirect("/admin/claims?notice=error");
  const mail = emailLayout({
    heading: "About your claim",
    paragraphs: ["Thank you for your claim. We were not able to approve it this time.", note, "If you think we have made a mistake, just reply to this email or write to hello@eyecarejobs.ca and a person will look again."],
  });
  await sendEmail({ to: claim[0].claimant_email, subject: "About your claim on Kestrel", ...mail });
  revalidatePath("/admin/claims");
  redirect("/admin/claims?notice=rejected");
}
