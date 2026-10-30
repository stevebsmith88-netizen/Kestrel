import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { SignInForm } from "@/components/AuthForms";
import { getSession, homeFor } from "@/lib/auth";
import { safeNext } from "@/lib/auth-copy";

export const metadata: Metadata = { title: "Sign in | Kestrel Eye Care Jobs", robots: { index: false } };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const session = await getSession();
  const { error, next } = await searchParams;
  if (session) redirect(next ? safeNext(next, homeFor(session.role)) : homeFor(session.role));
  const notice = error === "link" ? "That link has expired or was already used. Please sign in, or ask for a new one." : undefined;
  return (
    <AuthShell title="Sign in" intro="Welcome back.">
      <SignInForm notice={notice} next={next ? safeNext(next, "") || undefined : undefined} />
    </AuthShell>
  );
}
