import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { completeCardSetup } from "@/lib/job-payment-flow";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Saving your card | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

// Where Stripe sends a clinic back to after the card page (lib/job-payment-flow.ts). Nothing is charged here. If the card was saved, the
// job goes into review and the clinic lands on its dashboard. If the clinic backed out, the job stays a draft. Safe to open twice.
export default async function CardSaved({ searchParams }: { searchParams: Promise<{ session_id?: string; from?: string; cancelled?: string }> }) {
  const session = await requireRole("clinic");
  const { session_id: sessionId, from, cancelled } = await searchParams;
  if (cancelled) redirect("/clinic?notice=payment-card-failed");
  if (!sessionId) redirect("/clinic");

  const done = await completeCardSetup(sessionId);
  if (!("error" in done)) {
    // The job must be one of this person's own (their sign in can only read their own clinics' jobs).
    const db = await supabaseServer();
    const { data: mine } = db ? await db.from("jobs").select("id").eq("id", done.jobId).maybeSingle() : { data: null };
    if (mine) redirect(from === "update" ? "/clinic?notice=card-updated" : "/clinic?notice=job-submitted");
  }
  const message = "error" in done ? done.error : "We could not match that payment to one of your jobs.";
  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <h1>We could not finish that</h1>
          <p className="lede2">{message}</p>
          <p><Link className="btn" href="/clinic">Back to my dashboard</Link></p>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
