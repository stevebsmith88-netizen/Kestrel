import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { getMyClinics } from "@/lib/clinic";
import { completePassCheckout } from "@/lib/pass-flow";

export const metadata: Metadata = { title: "Starting your pass | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// Where Stripe sends a clinic back to after starting a pass (lib/pass-flow.ts). Safe to open twice.
export default async function PassStarted({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const session = await requireRole("clinic");
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect("/clinic/plans");
  const done = await completePassCheckout(sessionId);
  if (!("error" in done)) {
    const mine = (await getMyClinics(session.userId)).some((c) => c.id === done.employerId);
    if (mine) redirect("/clinic/plans?notice=pass-started");
  }
  const message = "error" in done ? done.error : "We could not match that pass to one of your locations.";
  return (
    <>
      <AppBar session={session} current="/clinic/plans" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>We could not finish that</h1>
          <p className="lede2">{message}</p>
          <p><Link className="btn" href="/clinic/plans">Back to Plans</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
