import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { SignUpForm } from "@/components/AuthForms";
import { getSession, homeFor } from "@/lib/auth";
import { googleSignInOn } from "@/lib/features";
import { clinicInviteOnly } from "@/lib/invite";

export const metadata: Metadata = { title: "Create an account | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function SignUp({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const session = await getSession();
  if (session) redirect(session.needsAccountType ? "/welcome" : homeFor(session.role));
  return (
    <AuthShell>
      <SignUpForm defaultType={type === "clinic" ? "clinic" : "candidate"} google={googleSignInOn()} inviteOnly={clinicInviteOnly()} />
    </AuthShell>
  );
}
