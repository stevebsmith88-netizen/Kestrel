import "server-only";
import { revalidatePath } from "next/cache";
import { emailLayout, sendEmail, SITE_URL } from "@/lib/email";
import { refreshJobPages } from "@/lib/job-cache";
import type { supabaseAdmin } from "@/lib/supabase-server";

// Approving a claim, with no page and no sign in check of its own: the review page's button and the Slack button both call it after their own
// checks. The clinic becomes the owner of the profile and its listing, and is told by email.
export type ClaimApproval = { ok: true; clinicName: string } | { ok: false; reason: "error" | "has-clinic" | "taken" };

export async function approveClaimCore(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, id: string): Promise<ClaimApproval> {
  const { data: claim } = await admin.from("listing_claims").select("id, user_id, employer_id, claimant_email").eq("id", id).eq("status", "pending_review").maybeSingle();
  if (!claim) return { ok: false, reason: "error" };

  const { data: mine } = await admin.from("employers").select("id").eq("owner_id", claim.user_id).limit(1).maybeSingle();
  if (mine) return { ok: false, reason: "has-clinic" };

  // Only an unclaimed listing can be claimed, even if two claims are approved at once.
  const { data: taken } = await admin.from("employers").update({ owner_id: claim.user_id, claimed: true }).eq("id", claim.employer_id).eq("claimed", false).select("id, clinic_name");
  if (!taken?.length) return { ok: false, reason: "taken" };

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
  refreshJobPages();
  return { ok: true, clinicName: taken[0].clinic_name };
}


// Declining a claim with a note for the claimant, with no page and no sign in check of its own: the claims page and the Slack form both call it after their
// own checks. The claimant is told by email.
export type ClaimDecline = { ok: true } | { ok: false; reason: "error" | "need-note" };

export async function rejectClaimCore(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, id: string, note: string): Promise<ClaimDecline> {
  if (!note) return { ok: false, reason: "need-note" };
  const { data: claim } = await admin.from("listing_claims").update({ status: "rejected", decided_at: new Date().toISOString(), decision_note: note }).eq("id", id).eq("status", "pending_review").select("claimant_email");
  if (!claim?.length) return { ok: false, reason: "error" };
  const mail = emailLayout({
    heading: "About your claim",
    paragraphs: ["Thank you for your claim. We were not able to approve it this time.", note, "If you think we have made a mistake, just reply to this email or write to support@eyecarejobs.ca and a person will look again."],
  });
  await sendEmail({ to: claim[0].claimant_email, subject: "About your claim on Kestrel", ...mail });
  revalidatePath("/admin/claims");
  return { ok: true };
}
