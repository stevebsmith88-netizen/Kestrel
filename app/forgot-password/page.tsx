import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/AuthForms";

// Built fresh for every visit, as it was before audit P1-10. Only the pages Steve listed are saved and shared; this one was not on the list.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reset your password | Kestrel Eye Care Jobs", robots: { index: false } };

export default function ForgotPassword() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
