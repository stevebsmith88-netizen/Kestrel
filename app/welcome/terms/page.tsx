import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { TermsForm } from "@/components/AuthForms";
import { getSession, homeFor } from "@/lib/auth";

export const metadata: Metadata = { title: "Before you carry on | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// Where a signed in person with no record of agreeing to the terms is sent, once (audit P1-03). Google sign ups agree on /welcome.
export default async function AgreeToTerms() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.needsAccountType) redirect("/welcome");
  if (!session.needsTerms) redirect(homeFor(session.role));
  return (
    <AuthShell>
      <TermsForm email={session.email} />
    </AuthShell>
  );
}
