import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Reset your password | Kestrel Eye Care Jobs", robots: { index: false } };

export default function ForgotPassword() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
