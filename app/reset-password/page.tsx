import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/AuthForms";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { RECOVERY_COOKIE, recoveryIsValid } from "@/lib/recovery";

export const metadata: Metadata = { title: "Choose a new password | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function ResetPassword() {
  // People arrive here from the link in their email, which signs them in first.
  const session = await getSession();
  if (!session) redirect("/sign-in?error=link");
  // Signed in is not enough. Without the cookie the reset link leaves, ask for a new link.
  const jar = await cookies();
  if (!recoveryIsValid(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", session.userId, jar.get(RECOVERY_COOKIE)?.value)) redirect("/forgot-password");
  return (
    <AuthShell title="Choose a new password">
      <ResetPasswordForm />
    </AuthShell>
  );
}
