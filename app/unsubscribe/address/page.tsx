import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { unsubscribeAddress } from "@/lib/unsubscribe";
import { addressFromUnsubscribe } from "@/lib/unsubscribe-token";

export const metadata: Metadata = { title: "Unsubscribe | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

type Search = { e?: string; s?: string; done?: string; problem?: string };

export default async function UnsubscribeAddress({ searchParams }: { searchParams: Promise<Search> }) {
  const { e, s, done, problem } = await searchParams;
  const address = addressFromUnsubscribe(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", e, s);
  return (
    <AuthShell title={done ? "You are unsubscribed" : "Unsubscribe from Kestrel emails"}>
      {done ? (
        <>
          <p className="auth-intro">We will not send you any more emails like this one, and we will not email this address again about jobs we list, even if a job is posted later.</p>
          <p className="alt"><Link href="/">Back to Kestrel</Link></p>
        </>
      ) : address ? (
        <>
          <p className="auth-intro">Press the button and we will stop emailing <strong>{address}</strong>. We will act on this straight away.</p>
          <form action={unsubscribeAddress}>
            <input type="hidden" name="e" value={e} />
            <input type="hidden" name="s" value={s} />
            <button type="submit" className="btn">Unsubscribe me</button>
          </form>
          <p className="alt">Changed your mind? <Link href="/">Take me back</Link></p>
        </>
      ) : (
        <>
          <p className="auth-intro">{problem ? "Something went wrong with that link." : "That link doesn't look right."} Please email <a href="mailto:hello@eyecarejobs.ca">hello@eyecarejobs.ca</a> and tell us which address to stop, and we will do it.</p>
          <p className="alt"><Link href="/">Back to Kestrel</Link></p>
        </>
      )}
    </AuthShell>
  );
}
