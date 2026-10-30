import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { getSession } from "@/lib/auth";
import { verifyClaim } from "@/lib/claim-actions";

export const metadata: Metadata = { title: "Confirm your claim | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Search = { c?: string; t?: string; done?: string; problem?: string };

// The page behind the link in the verification email. The button, not the link itself, confirms
// the claim, so an email scanner that opens links cannot confirm it by mistake.
export default async function VerifyClaim({ searchParams }: { searchParams: Promise<Search> }) {
  const { c, t, done, problem } = await searchParams;
  if (done) {
    return (
      <AuthShell title="Claim confirmed">
        <p className="auth-intro">Thank you. Your email address is confirmed. Our team will take a quick look at your claim and email you, usually within 1 business day.</p>
        <p className="alt"><Link href="/clinic">Go to my dashboard</Link></p>
      </AuthShell>
    );
  }
  if (problem || !c || !t) {
    return (
      <AuthShell title="That link didn't work">
        <p className="auth-intro">The link may have expired, been used already, or been opened while signed in to a different account. Go back to the listing and start your claim again, or email <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a> and we will help.</p>
        <p className="alt"><Link href="/jobs">Find jobs</Link></p>
      </AuthShell>
    );
  }
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(`/claim/verify?c=${c}&t=${t}`)}`);
  return (
    <AuthShell title="Confirm your claim">
      <p className="auth-intro">Press the button to confirm that this email address is yours and that you represent the clinic.</p>
      <form action={verifyClaim}>
        <input type="hidden" name="c" value={c} />
        <input type="hidden" name="t" value={t} />
        <button type="submit" className="btn">Confirm my claim</button>
      </form>
    </AuthShell>
  );
}
