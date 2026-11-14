"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { isEmail, NOT_CONNECTED } from "@/lib/auth-copy";
import type { JobFormState } from "@/lib/jobs";
import { getMyEmployer } from "@/lib/clinic";
import { sendEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase-server";
import { codeHash, inviteExpiry, isMemberLevel, newInviteCode, OWNER_ONLY_TEXT, TEAM_MAX } from "@/lib/team";
import { teamInviteEmail } from "@/lib/team-emails";
import { acceptInvite, placesTaken, transferOwnership } from "@/lib/team-server";

// The Team page (My clinic, Team). Only the clinic owner changes the team; every change is made with the server key after that check.
export type TeamState = JobFormState & { code?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").replace(/\s+/g, " ").trim().slice(0, max);

async function ownerOnly() {
  const session = await requireRole("clinic");
  const employer = await getMyEmployer(session.userId);
  const admin = supabaseAdmin();
  if (!employer || employer.level !== "owner" || !admin) return null;
  return { session, employer, admin };
}

// Creates an invitation and emails it. The code is shown to the owner once too, so they can pass it on by hand if the email goes astray
// (and on the demo site, which never sends email). Only a fingerprint of it is stored.
async function createInvite(admin: NonNullable<ReturnType<typeof supabaseAdmin>>, args: { employerId: string; clinicName: string; inviterId: string; inviter: string; name: string; email: string; level: string }) {
  const code = newInviteCode();
  const { error } = await admin.from("employer_invites").insert({
    employer_id: args.employerId, name: args.name, email: args.email, level: args.level, code_hash: codeHash(code), invited_by: args.inviterId, expires_at: inviteExpiry(new Date()).toISOString(),
  });
  if (error) {
    console.error("Invite not saved:", error.code, error.message);
    return null;
  }
  await sendEmail({ to: args.email, ...teamInviteEmail({ name: args.name, clinicName: args.clinicName, inviter: args.inviter, level: args.level, code }) });
  return code;
}

export async function inviteTeamMember(_prev: TeamState, form: FormData): Promise<TeamState> {
  const ctx = await ownerOnly();
  if (!ctx) return { error: OWNER_ONLY_TEXT };
  const { session, employer, admin } = ctx;
  const name = text(form, "name", 120);
  const email = text(form, "email", 254).toLowerCase();
  const level = String(form.get("level") ?? "");
  if (!name) return { error: "Enter their name." };
  if (!isEmail(email)) return { error: "Enter their email address, like sam@yourclinic.ca." };
  if (!isMemberLevel(level)) return { error: "Choose what they can do." };
  if (email === session.email.toLowerCase()) return { error: "That is your own email address." };
  const { people, invites, taken } = await placesTaken(admin, employer.id);
  if (people.some((p) => p.email.toLowerCase() === email)) return { error: "That person is already on your team." };
  if (invites.some((i) => i.email === email)) return { error: "You have already invited that address. Use Send again beside it if they cannot find the email." };
  if (taken >= TEAM_MAX) return { error: `A clinic can have up to ${TEAM_MAX} people, including you, and open invitations count too. Remove someone or cancel an invitation first.` };
  const code = await createInvite(admin, { employerId: employer.id, clinicName: employer.clinic_name, inviterId: session.userId, inviter: session.fullName || session.firstName || "Your clinic", name, email, level });
  if (!code) return { error: "We couldn't send the invitation just now. Please try again." };
  revalidatePath("/clinic/team");
  return { message: `Invitation sent to ${email}.`, code };
}

// A fresh code for an open invitation (the old one stops working), for when the email went astray.
export async function resendInvite(_prev: TeamState, form: FormData): Promise<TeamState> {
  const ctx = await ownerOnly();
  if (!ctx) return { error: OWNER_ONLY_TEXT };
  const { session, employer, admin } = ctx;
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return { error: "That didn't work. Please refresh and try again." };
  const { data: old } = await admin.from("employer_invites").select("name, email, level").eq("id", id).eq("employer_id", employer.id).is("accepted_at", null).is("cancelled_at", null).maybeSingle();
  if (!old) return { error: "That invitation has already been used or cancelled." };
  await admin.from("employer_invites").update({ cancelled_at: new Date().toISOString() }).eq("id", id);
  const code = await createInvite(admin, { employerId: employer.id, clinicName: employer.clinic_name, inviterId: session.userId, inviter: session.fullName || session.firstName || "Your clinic", name: old.name, email: old.email, level: old.level });
  revalidatePath("/clinic/team");
  return code ? { message: `A new invitation is on its way to ${old.email}. The old code no longer works.`, code } : { error: "We couldn't send the invitation just now. Please try again." };
}

export async function cancelInvite(_prev: TeamState, form: FormData): Promise<TeamState> {
  const ctx = await ownerOnly();
  if (!ctx) return { error: OWNER_ONLY_TEXT };
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return { error: "That didn't work. Please refresh and try again." };
  await ctx.admin.from("employer_invites").update({ cancelled_at: new Date().toISOString() }).eq("id", id).eq("employer_id", ctx.employer.id).is("accepted_at", null);
  revalidatePath("/clinic/team");
  return { message: "Invitation cancelled. The code no longer works." };
}

// Someone has left the clinic, say: their access ends straight away.
export async function removeTeamMember(_prev: TeamState, form: FormData): Promise<TeamState> {
  const ctx = await ownerOnly();
  if (!ctx) return { error: OWNER_ONLY_TEXT };
  const userId = String(form.get("userId") ?? "");
  if (!UUID.test(userId)) return { error: "That didn't work. Please refresh and try again." };
  const { error } = await ctx.admin.from("employer_members").delete().eq("employer_id", ctx.employer.id).eq("user_id", userId);
  if (error) return { error: "We couldn't remove them just now. Please try again." };
  revalidatePath("/clinic/team");
  return { message: "Removed. They can no longer see your clinic, its jobs or its applicants." };
}

export async function changeTeamLevel(_prev: TeamState, form: FormData): Promise<TeamState> {
  const ctx = await ownerOnly();
  if (!ctx) return { error: OWNER_ONLY_TEXT };
  const userId = String(form.get("userId") ?? "");
  const level = String(form.get("level") ?? "");
  if (!UUID.test(userId) || !isMemberLevel(level)) return { error: "That didn't work. Please refresh and try again." };
  const { error } = await ctx.admin.from("employer_members").update({ level }).eq("employer_id", ctx.employer.id).eq("user_id", userId);
  if (error) return { error: "We couldn't change that just now. Please try again." };
  revalidatePath("/clinic/team");
  return { message: "Saved." };
}

export async function makeOwner(_prev: TeamState, form: FormData): Promise<TeamState> {
  const ctx = await ownerOnly();
  if (!ctx) return { error: OWNER_ONLY_TEXT };
  const userId = String(form.get("userId") ?? "");
  if (!UUID.test(userId) || form.get("confirm") !== "yes") return { error: "Tick the box to confirm." };
  const problem = await transferOwnership(ctx.admin, ctx.employer.id, userId);
  if (problem) return { error: problem };
  revalidatePath("/clinic/team");
  redirect("/clinic/team?handed=1");
}

// Joining a clinic with an invite code, for someone who already has a clinic account (a new account joins at sign up).
export async function joinWithCode(_prev: TeamState, form: FormData): Promise<TeamState> {
  const session = await requireRole("clinic", "candidate");
  const admin = supabaseAdmin();
  if (!admin) return { error: NOT_CONNECTED };
  if (session.role !== "clinic") return { error: "This account is set up for looking for work. Ask the clinic to send the invitation to a different email address, such as your work email, and create a clinic account with it." };
  if (await getMyEmployer(session.userId)) return { error: "Your account already belongs to a clinic on Kestrel. Ask the clinic to send the invite to a different email, or email support@eyecarejobs.ca." };
  const problem = await acceptInvite(admin, String(form.get("code") ?? ""), { id: session.userId, email: session.email, name: session.fullName });
  if (problem) return { error: problem };
  redirect("/clinic?notice=team-joined");
}
