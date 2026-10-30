import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { unsubscribe } from "@/lib/unsubscribe";

export const metadata: Metadata = { title: "Unsubscribe | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function Unsubscribe({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string }> }) {
  const { id } = await params;
  const { done } = await searchParams;
  return (
    <AuthShell title={done ? "You are unsubscribed" : "Unsubscribe from Kestrel emails"}>
      {done ? (
        <>
          <p className="auth-intro">We will not send you any more marketing emails. If you have an account, you will still receive emails about it, such as password resets.</p>
          <p className="alt"><Link href="/">Back to Kestrel</Link></p>
        </>
      ) : (
        <>
          <p className="auth-intro">Press the button and we will stop sending you launch news, job alerts, product updates and offers. We will act on this straight away.</p>
          <form action={unsubscribe}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="btn">Unsubscribe me</button>
          </form>
          <p className="alt">Changed your mind? <Link href="/">Take me back</Link></p>
        </>
      )}
    </AuthShell>
  );
}
