"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { NOT_CONNECTED } from "@/lib/auth-copy";
import { refreshJobPages } from "@/lib/job-cache";
import { cleanClinic, validateClinic, type JobFormState } from "@/lib/jobs";
import { sendEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase-server";
import { codeHash, inviteExpiry, newInviteCode } from "@/lib/team";
import { teamInviteEmail } from "@/lib/team-emails";
import { logAdminAction, transferOwnership } from "@/lib/team-server";
import { clinicAccess } from "@/lib/support-server";

// Admin, Clinics (Steve, 14th November 2026): Kestrel fixes things for a clinic that is stuck. Every change asks why, is saved in the
// admin record (admin_actions, migration 0045) and the clinic's owner is told in their inbox. Admin never sees applicants' resumes here.
export type AdminClinicState = JobFormState & { code?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reasonOf = (form: FormData) => String(form.get("reason") ?? "").replace(/\s+/g, " ").trim().slice(0, 500);

async function adminContext(form: FormData) {
  const session = await requireRole("admin");
  const admin = supabaseAdmin();
  const employerId = String(form.get("employerId") ?? "");
  const reason = reasonOf(form);
  if (!admin) return { error: NOT_CONNECTED } as const;
  if (!UUID.test(employerId)) return { error: "That didn't work. Please refresh and try again." } as const;
  if (reason.length < 5) return { error: "Say briefly what you are doing for them." } as const;
  // Only while the clinic's owner has an open help request that lets Kestrel in (Steve, 14th November 2026; migration 0046).
  if (!(await clinicAccess(admin, employerId))) return { error: "This clinic has not given Kestrel access. It can do that from Help and feedback in its account." } as const;
  return { session, admin, employerId, reason } as const;
}

export async function adminSaveClinic(_prev: AdminClinicState, form: FormData): Promise<AdminClinicState> {
  const ctx = await adminContext(form);
  if ("error" in ctx) return { error: ctx.error };
  const clinic = cleanClinic({ clinicName: form.get("clinicName") ?? "", practiceType: form.get("practiceType") ?? "", website: form.get("website") ?? "", province: form.get("province") ?? "", city: form.get("city") ?? "", about: form.get("about") ?? "", notifyEmail: "hello@eyecarejobs.ca" /* not saved: the alert address stays the clinic's own */, directHire: true, employeeBand: "" });
  const errors = validateClinic(clinic);
  if (Object.keys(errors).length) return { errors, error: "Please check the highlighted answers." };
  const { error } = await ctx.admin.from("employers").update({ clinic_name: clinic.clinicName, practice_type: clinic.practiceType, website: clinic.website || null, province: clinic.province, city: clinic.city, about: clinic.about || null }).eq("id", ctx.employerId);
  if (error) return { error: "We couldn't save the profile. Please try again." };
  await logAdminAction(ctx.admin, { adminId: ctx.session.userId, employerId: ctx.employerId, action: "Updated the profile", detail: clinic.clinicName, reason: ctx.reason });
  refreshJobPages();
  revalidatePath(`/admin/clinics/${ctx.employerId}`);
  return { message: "Saved, recorded, and the owner has been told." };
}

export async function adminCancelInvite(_prev: AdminClinicState, form: FormData): Promise<AdminClinicState> {
  const ctx = await adminContext(form);
  if ("error" in ctx) return { error: ctx.error };
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return { error: "That didn't work." };
  await ctx.admin.from("employer_invites").update({ cancelled_at: new Date().toISOString() }).eq("id", id).eq("employer_id", ctx.employerId).is("accepted_at", null);
  await logAdminAction(ctx.admin, { adminId: ctx.session.userId, employerId: ctx.employerId, action: "Cancelled an invitation", reason: ctx.reason });
  revalidatePath(`/admin/clinics/${ctx.employerId}`);
  return { message: "Cancelled and recorded." };
}

// A new code for an open invitation, emailed again. The code is shown once, so it can be read out to the person if the email is lost.
export async function adminResendInvite(_prev: AdminClinicState, form: FormData): Promise<AdminClinicState> {
  const ctx = await adminContext(form);
  if ("error" in ctx) return { error: ctx.error };
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return { error: "That didn't work." };
  const { data: old } = await ctx.admin.from("employer_invites").select("name, email, level, invited_by").eq("id", id).eq("employer_id", ctx.employerId).is("accepted_at", null).is("cancelled_at", null).maybeSingle();
  if (!old) return { error: "That invitation has already been used or cancelled." };
  const { data: employer } = await ctx.admin.from("employers").select("clinic_name").eq("id", ctx.employerId).maybeSingle();
  await ctx.admin.from("employer_invites").update({ cancelled_at: new Date().toISOString() }).eq("id", id);
  const code = newInviteCode();
  const { error } = await ctx.admin.from("employer_invites").insert({ employer_id: ctx.employerId, name: old.name, email: old.email, level: old.level, code_hash: codeHash(code), invited_by: old.invited_by, expires_at: inviteExpiry(new Date()).toISOString() });
  if (error) return { error: "We couldn't make a new invitation. Please try again." };
  await sendEmail({ to: old.email, ...teamInviteEmail({ name: old.name, clinicName: employer?.clinic_name ?? "your clinic", inviter: "The Kestrel team, for your clinic", level: old.level, code }) });
  await logAdminAction(ctx.admin, { adminId: ctx.session.userId, employerId: ctx.employerId, action: "Sent an invitation again", detail: old.email, reason: ctx.reason });
  revalidatePath(`/admin/clinics/${ctx.employerId}`);
  return { message: `Sent again to ${old.email}.`, code };
}

export async function adminRemoveMember(_prev: AdminClinicState, form: FormData): Promise<AdminClinicState> {
  const ctx = await adminContext(form);
  if ("error" in ctx) return { error: ctx.error };
  const userId = String(form.get("userId") ?? "");
  if (!UUID.test(userId)) return { error: "That didn't work." };
  const { error } = await ctx.admin.from("employer_members").delete().eq("employer_id", ctx.employerId).eq("user_id", userId);
  if (error) return { error: "We couldn't remove them. Please try again." };
  await logAdminAction(ctx.admin, { adminId: ctx.session.userId, employerId: ctx.employerId, action: "Removed a team member", reason: ctx.reason });
  revalidatePath(`/admin/clinics/${ctx.employerId}`);
  return { message: "Removed and recorded." };
}

// Only after the clinic has asked from a published clinic address (the reason says so). The old owner stays on the team.
export async function adminMakeOwner(_prev: AdminClinicState, form: FormData): Promise<AdminClinicState> {
  const ctx = await adminContext(form);
  if ("error" in ctx) return { error: ctx.error };
  const userId = String(form.get("userId") ?? "");
  if (!UUID.test(userId)) return { error: "That didn't work." };
  const problem = await transferOwnership(ctx.admin, ctx.employerId, userId);
  if (problem) return { error: problem };
  await logAdminAction(ctx.admin, { adminId: ctx.session.userId, employerId: ctx.employerId, action: "Changed the owner", reason: ctx.reason });
  revalidatePath(`/admin/clinics/${ctx.employerId}`);
  return { message: "The clinic has a new owner. Recorded, and the new owner has been told." };
}
