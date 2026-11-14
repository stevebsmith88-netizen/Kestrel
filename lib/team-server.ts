import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { refreshJobPages } from "@/lib/job-cache";
import { notify } from "@/lib/notifications";
import { teamMemberJoined } from "@/lib/notify-text";
import { codeHash, inviteProblem, isMemberLevel, levelLabel, type MemberLevel } from "@/lib/team";

// The server side of a clinic's team (migration 0045). Every change here is made with the server key, after the caller has checked who
// is asking (the clinic owner, or Kestrel's admin), because nobody changes a team with their own sign in.

type Admin = SupabaseClient;
export type Invite = { id: string; employer_id: string; name: string; email: string; level: string; expires_at: string; accepted_at: string | null; cancelled_at: string | null; created_at: string };
const INVITE_COLUMNS = "id, employer_id, name, email, level, expires_at, accepted_at, cancelled_at, created_at";

export async function findInvite(admin: Admin, code: string): Promise<Invite | null> {
  const { data, error } = await admin.from("employer_invites").select(INVITE_COLUMNS).eq("code_hash", codeHash(code)).maybeSingle();
  if (error) console.error("Invite lookup failed:", error.code, error.message);
  return (data as Invite | null) ?? null;
}

// Adds the person to the clinic at the level the owner chose, marks the invitation used, and tells the owner. Returns why not, or null.
export async function acceptInvite(admin: Admin, code: string, user: { id: string; email: string; name: string }): Promise<string | null> {
  const invite = await findInvite(admin, code);
  const problem = inviteProblem(invite, user.email);
  if (problem || !invite) return problem ?? "That invite code is not right.";
  const level: MemberLevel = isMemberLevel(invite.level) ? invite.level : "view";
  const { error } = await admin.from("employer_members").insert({ employer_id: invite.employer_id, user_id: user.id, level });
  if (error) {
    console.error("Joining a clinic failed:", error.code, error.message);
    if (/up to 5/.test(error.message)) return "This clinic's team is full (5 people). Ask the owner to remove someone first.";
    if (/own clinic|another clinic/.test(error.message) || error.code === "23505") return "Your account already belongs to a clinic on Kestrel. Ask the clinic to send the invite to a different email, or email support@eyecarejobs.ca.";
    return "We couldn't add you to the clinic just now. Please try again.";
  }
  await admin.from("employer_invites").update({ accepted_at: new Date().toISOString(), accepted_by: user.id }).eq("id", invite.id).is("accepted_at", null);
  const { data: owner } = await admin.from("employers").select("owner_id").eq("id", invite.employer_id).maybeSingle();
  await notify(admin, owner?.owner_id, teamMemberJoined({ name: user.name || invite.name, level: levelLabel(level).toLowerCase() }));
  return null;
}

export type TeamPerson = { userId: string; name: string; email: string; level: "owner" | MemberLevel; since: string | null };

// Everyone on a clinic's team, owner first, with names and email addresses (read with the server key: people cannot read each other's
// accounts with their own sign in).
export async function loadTeam(admin: Admin, employerId: string): Promise<{ people: TeamPerson[]; invites: Invite[] }> {
  const [{ data: employer }, { data: members }, { data: invites }] = await Promise.all([
    admin.from("employers").select("owner_id, created_at").eq("id", employerId).maybeSingle(),
    admin.from("employer_members").select("user_id, level, created_at").eq("employer_id", employerId).order("created_at"),
    admin.from("employer_invites").select(INVITE_COLUMNS).eq("employer_id", employerId).is("accepted_at", null).is("cancelled_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
  ]);
  const rows: { userId: string; level: TeamPerson["level"]; since: string | null }[] = [
    ...(employer?.owner_id ? [{ userId: employer.owner_id as string, level: "owner" as const, since: employer.created_at as string }] : []),
    ...((members ?? []) as { user_id: string; level: string; created_at: string }[]).map((m) => ({ userId: m.user_id, level: (m.level === "edit" ? "edit" : "view") as MemberLevel, since: m.created_at })),
  ];
  const { data: profiles } = rows.length ? await admin.from("profiles").select("id, full_name").in("id", rows.map((r) => r.userId)) : { data: [] };
  const names = new Map(((profiles ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name ?? ""]));
  const people = await Promise.all(
    rows.map(async (r) => {
      const { data } = await admin.auth.admin.getUserById(r.userId);
      return { ...r, name: names.get(r.userId) || "Someone", email: data.user?.email ?? "" };
    }),
  );
  return { people, invites: (invites ?? []) as Invite[] };
}

// Open invitations still count toward the 5, so an owner cannot send more invitations than there are places.
export async function placesTaken(admin: Admin, employerId: string) {
  const { people, invites } = await loadTeam(admin, employerId);
  return { people, invites, taken: people.length + invites.length };
}

// Hands the clinic to a team member. The old owner stays on the team, able to view and edit. Order matters: the new owner leaves the
// member list first (an owner cannot also be a member), then ownership moves, then the old owner joins the list.
export async function transferOwnership(admin: Admin, employerId: string, newOwnerId: string): Promise<string | null> {
  const { data: employer } = await admin.from("employers").select("owner_id").eq("id", employerId).maybeSingle();
  const { data: member } = await admin.from("employer_members").select("level").eq("employer_id", employerId).eq("user_id", newOwnerId).maybeSingle();
  if (!employer?.owner_id || !member) return "That person is not on this clinic's team.";
  const oldOwner = employer.owner_id as string;
  const { error: leave } = await admin.from("employer_members").delete().eq("employer_id", employerId).eq("user_id", newOwnerId);
  if (leave) return "We couldn't hand over the clinic just now. Please try again.";
  const { error: move } = await admin.from("employers").update({ owner_id: newOwnerId }).eq("id", employerId);
  if (move) {
    await admin.from("employer_members").insert({ employer_id: employerId, user_id: newOwnerId, level: member.level });
    return "We couldn't hand over the clinic just now. Please try again.";
  }
  const { error: join } = await admin.from("employer_members").insert({ employer_id: employerId, user_id: oldOwner, level: "edit" });
  if (join) console.error("The old owner could not be added to the team:", join.message);
  refreshJobPages(); // nothing public shows the owner, but the rule is simple: any change to a clinic clears the saved pages
  return null;
}

// What Kestrel's admin changed for a clinic (Admin, Clinics). The clinic's owner is told in their inbox.
export async function logAdminAction(admin: Admin, row: { adminId: string; employerId: string; action: string; detail?: string; reason?: string }) {
  const { error } = await admin.from("admin_actions").insert({ admin_id: row.adminId, employer_id: row.employerId, action: row.action.slice(0, 60), detail: row.detail?.slice(0, 1000) ?? null, reason: row.reason?.slice(0, 500) ?? null });
  if (error) console.error("Admin action not recorded:", error.code, error.message);
  const { data: owner } = await admin.from("employers").select("owner_id").eq("id", row.employerId).maybeSingle();
  await notify(admin, owner?.owner_id, { kind: "kestrel_change", title: `Kestrel ${row.action.toLowerCase()} for your clinic`, body: row.reason ? `At your request: ${row.reason}` : "If you did not ask for this, reply to any Kestrel email and we will look into it.", href: "/clinic/team" });
}
