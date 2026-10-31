import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { WelcomeForm } from "@/components/AuthForms";
import { getSession, homeFor } from "@/lib/auth";
import { clinicInviteOnly } from "@/lib/invite";

export const metadata: Metadata = { title: "Welcome | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// The first stop after "Continue with Google": say whether you are looking for a job or hiring.
export default async function Welcome({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!session.needsAccountType) redirect(homeFor(session.role));
  const { type } = await searchParams;
  return (
    <AuthShell>
      <WelcomeForm defaultType={type === "clinic" ? "clinic" : "candidate"} email={session.email} hasName={Boolean(session.firstName)} inviteOnly={clinicInviteOnly()} />
    </AuthShell>
  );
}
