import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/AuthForms";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function ResetPassword() {
  // People arrive here from the link in their email, which signs them in first.
  const session = await getSession();
  if (!session) redirect("/sign-in?error=link");
  return (
    <AuthShell title="Choose a new password">
      <ResetPasswordForm />
    </AuthShell>
  );
}
