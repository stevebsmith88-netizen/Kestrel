import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { JoinForm } from "@/components/TeamForms";
import { getSession } from "@/lib/auth";
import { getMyEmployer } from "@/lib/clinic";
import { cleanInviteCode } from "@/lib/team";

export const metadata: Metadata = { title: "Join your clinic | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// Where the link in a team invitation email lands (migration 0045). New people create an account; anyone with a clinic account signs in
// and enters the code.
export default async function Join({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: raw } = await searchParams;
  const code = cleanInviteCode(raw ?? "");
  const session = await getSession();
  const here = `/join${code ? `?code=${encodeURIComponent(code)}` : ""}`;
  const employer = session?.role === "clinic" ? await getMyEmployer(session.userId) : null;
  return (
    <AuthShell>
      <h1>Join your clinic on Kestrel</h1>
      {!session ? (
        <>
          <p className="auth-intro">Your clinic has invited you to help with hiring. New to Kestrel? Create your account with the email address the invitation was sent to. Already have a clinic account? Sign in, then enter your code.</p>
          <p><Link href={`/sign-up${code ? `?team=${encodeURIComponent(code)}` : ""}`} className="btn">Create my account</Link></p>
          <p className="alt">Already have an account? <Link href={`/sign-in?next=${encodeURIComponent(here)}`}>Sign in</Link></p>
        </>
      ) : session.role !== "clinic" ? (
        <p className="auth-intro">You are signed in with an account for looking for work. Ask the clinic to send the invitation to a different email address, such as your work email, and create a clinic account with it.</p>
      ) : (
        <>
          <p className="auth-intro">Enter the code from your invitation email to join the clinic.{employer ? ` You keep ${employer.clinic_name} too, and switch between them with the Location picker on your dashboard.` : ""}</p>
          <JoinForm code={code} />
        </>
      )}
    </AuthShell>
  );
}
