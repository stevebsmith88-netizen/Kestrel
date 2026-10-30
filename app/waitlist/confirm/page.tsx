import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { valueIsGenuine } from "@/lib/unsubscribe-token";
import { WAITLIST_PURPOSE } from "@/lib/waitlist-confirm";
import { confirmWaitlist } from "@/lib/waitlist-actions";

export const metadata: Metadata = { title: "Confirm your email | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Search = { id?: string; s?: string; done?: string; problem?: string; unsubscribed?: string };

export default async function ConfirmWaitlist({ searchParams }: { searchParams: Promise<Search> }) {
  const { id, s, done, problem, unsubscribed } = await searchParams;
  if (done) {
    return (
      <AuthShell title="You are on the list">
        <p className="auth-intro">Thank you. Your email address is confirmed. We will email you the moment Kestrel opens.</p>
        <p className="alt"><Link href="/">Back to Kestrel</Link></p>
      </AuthShell>
    );
  }
  if (unsubscribed) {
    return (
      <AuthShell title="You unsubscribed">
        <p className="auth-intro">You have unsubscribed from Kestrel emails, so we have not added you. If you would like to join again, fill in the waitlist form on our home page.</p>
        <p className="alt"><Link href="/#join">Join the waitlist</Link></p>
      </AuthShell>
    );
  }
  const genuine = valueIsGenuine(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", WAITLIST_PURPOSE, id, s);
  if (problem || !genuine) {
    return (
      <AuthShell title="That link didn't work">
        <p className="auth-intro">The link may be incomplete. Please fill in the waitlist form again and we will send you a new one, or email <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a> and we will help.</p>
        <p className="alt"><Link href="/#join">Join the waitlist</Link></p>
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Confirm your email">
      <p className="auth-intro">Press the button to confirm your email address and finish joining the Kestrel waitlist.</p>
      <form action={confirmWaitlist}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="s" value={s} />
        <button type="submit" className="btn">Confirm my email</button>
      </form>
    </AuthShell>
  );
}
