import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { SignUpForm } from "@/components/AuthForms";
import { getSession, homeFor } from "@/lib/auth";
import { safeNext } from "@/lib/auth-copy";
import { googleSignInOn } from "@/lib/features";
import { clinicInviteOnly, inviteMatches } from "@/lib/invite";
import { signupsOpen } from "@/lib/signup-gate";
import { supabaseAdmin } from "@/lib/supabase-server";
import { cleanInviteCode, inviteProblem } from "@/lib/team";
import { findInvite } from "@/lib/team-server";

// A clinic team invitation link (/join sends people here as /sign-up?team=KT-...). Any open, unexpired invitation lets someone create the
// account it was sent for, gate open or closed; the address is checked again when the form is sent.
async function teamInvitation(raw: string | undefined) {
  const code = cleanInviteCode(raw ?? "");
  const admin = code ? supabaseAdmin() : null;
  if (!code || !admin) return undefined;
  const invite = await findInvite(admin, code);
  if (!invite || inviteProblem(invite, invite.email)) return undefined;
  const { data } = await admin.from("employers").select("clinic_name").eq("id", invite.employer_id).maybeSingle();
  return { code, clinicName: (data?.clinic_name as string | undefined) ?? "your clinic", email: invite.email };
}

export const metadata: Metadata = { title: "Create an account | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function SignUp({ searchParams }: { searchParams: Promise<{ type?: string; next?: string; invite?: string; team?: string }> }) {
  const { type, next, invite, team: teamParam } = await searchParams;
  const after = next ? safeNext(next, "") : "";
  const session = await getSession();
  if (session) redirect(session.needsAccountType ? "/welcome" : after || homeFor(session.role));
  // Until launch the sign up page is only for people with an invitation link. Everyone else goes to the waitlist.
  const open = await signupsOpen();
  const invited = !open && Boolean(invite) && inviteMatches(invite ?? "");
  const team = await teamInvitation(teamParam);
  if (!open && !invited && !team) redirect("/#join");
  return (
    <AuthShell>
      <SignUpForm defaultType={type === "clinic" ? "clinic" : "candidate"} google={open && googleSignInOn()} inviteOnly={open && clinicInviteOnly()} invitation={invited ? invite : undefined} next={after || undefined} team={team} />
    </AuthShell>
  );
}
