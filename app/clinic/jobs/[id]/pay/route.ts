import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getMyClinics } from "@/lib/clinic";
import { currentPaymentMode, startCardSetup } from "@/lib/job-payment-flow";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// "Update my card" (the link in the email sent when a card is refused at approval). Sends the clinic to Stripe's page to save a new card
// for this job. Nothing is charged there. Only someone who can edit the clinic's jobs can start it, and only for a job still waiting.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireRole("clinic");
  const { id } = await context.params;
  const db = await supabaseServer();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id) || currentPaymentMode() !== "card") redirect("/clinic");
  const { data: job } = await db.from("jobs").select("id, employer_id, status").eq("id", id).maybeSingle();
  const clinics = await getMyClinics(session.userId);
  const level = clinics.find((c) => c.id === job?.employer_id)?.level;
  if (!job || (level !== "owner" && level !== "edit") || !["draft", "in_review"].includes(job.status)) redirect("/clinic");
  const started = await startCardSetup(job.id, "update");
  if ("url" in started) redirect(started.url);
  redirect(`/clinic?notice=${"alreadySaved" in started ? "card-updated" : "payment-card-failed"}`);
}
