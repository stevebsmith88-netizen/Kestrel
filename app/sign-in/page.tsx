import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { SignInForm } from "@/components/AuthForms";
import { getSession, homeFor } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in | Kestrel Eye Care Jobs", robots: { index: false } };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const { error } = await searchParams;
  const notice = error === "link" ? "That link has expired or was already used. Please sign in, or ask for a new one." : undefined;
  return (
    <AuthShell title="Sign in" intro="Welcome back.">
      <SignInForm notice={notice} />
    </AuthShell>
  );
}
