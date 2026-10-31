import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { SignUpForm } from "@/components/AuthForms";
import { getSession, homeFor } from "@/lib/auth";
import { safeNext } from "@/lib/auth-copy";
import { googleSignInOn } from "@/lib/features";
import { clinicInviteOnly, inviteMatches } from "@/lib/invite";
import { signupsOpen } from "@/lib/signup-gate";

export const metadata: Metadata = { title: "Create an account | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function SignUp({ searchParams }: { searchParams: Promise<{ type?: string; next?: string; invite?: string }> }) {
  const { type, next, invite } = await searchParams;
  const after = next ? safeNext(next, "") : "";
  const session = await getSession();
  if (session) redirect(session.needsAccountType ? "/welcome" : after || homeFor(session.role));
  // Until launch the sign up page is only for people with an invitation link. Everyone else goes to the waitlist.
  const open = await signupsOpen();
  const invited = !open && Boolean(invite) && inviteMatches(invite ?? "");
  if (!open && !invited) redirect("/#join");
  return (
    <AuthShell>
      <SignUpForm defaultType={type === "clinic" ? "clinic" : "candidate"} google={open && googleSignInOn()} inviteOnly={open && clinicInviteOnly()} invitation={invited ? invite : undefined} next={after || undefined} />
    </AuthShell>
  );
}
