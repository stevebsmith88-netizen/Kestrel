import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import { requireRole } from "@/lib/auth";
import { bandInfo, bandForRole, dollars, jobPriceCents } from "@/lib/checkout-mode";
import { getMyEmployer } from "@/lib/clinic";
import { chooseSinglePost, chooseSwitchToPlus } from "@/lib/pass-actions";
import { getActivePass, passesAvailable, slotsUsed } from "@/lib/pass-flow";
import { passChoices, passDecision } from "@/lib/passes";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Confirm before sending | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const PROBLEMS: Record<string, string> = {
  card: "We could not find a card on your pass, so nothing was sent. Open Plans and manage billing to check it.",
  owner: "Only the clinic owner can switch the pass.",
  switch: "The pass was not changed and nothing has been charged.",
};

// Asked before a job is sent when the clinic's pass cannot cover it (the pass is full, or the role is not included). Nothing is sent or charged
// until the clinic chooses (Steve, 14th November 2026).
export default async function ConfirmJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ problem?: string; why?: string }> }) {
  const session = await requireRole("clinic");
  if (!passesAvailable()) redirect("/clinic");
  const { id } = await params;
  const { problem, why } = await searchParams;
  const employer = await getMyEmployer(session.userId);
  const db = supabaseAdmin();
  if (!employer || !db || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/clinic");
  const { data: job } = await db.from("jobs").select("id, title, role_category, employer_id, status").eq("id", id).maybeSingle();
  if (!job || job.employer_id !== employer.id || job.status !== "draft") redirect("/clinic");
  const pass = await getActivePass(db, employer.id);
  if (!pass) redirect(`/clinic/jobs/${id}`);
  const used = await slotsUsed(db, employer.id);
  const decision = passDecision(pass.plan, job.role_category, used);
  if (decision.kind === "covered") redirect(`/clinic/jobs/${id}`);
  const choices = passChoices(decision, pass.plan, job.role_category);
  const price = dollars(jobPriceCents(job.role_category));
  const owner = employer.level === "owner";
  return (
    <>
      <AppBar session={session} current="/clinic" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">{job.title}</p>
          <h1>{choices.headline}</h1>
          <p className="lede2">Your {pass.plan.name}: {used} of {pass.plan.livePosts} live posts in use. Nothing has been sent or charged yet.</p>
          {problem && PROBLEMS[problem] && <p className="err form-err" role="alert">{PROBLEMS[problem]}{why ? ` ${why}` : ""}</p>}
          <section className="card">
            <p>{choices.detail}</p>
            <div className="formbtns">
              <form action={chooseSinglePost}>
                <input type="hidden" name="id" value={job.id} />
                <button type="submit" className="btn">Send this job and pay {price} plus HST</button>
              </form>
              {choices.canUpgrade && owner && (
                <form action={chooseSwitchToPlus}>
                  <input type="hidden" name="id" value={job.id} />
                  <button type="submit" className="btn ghost">Switch to Clinic pass Plus and send it</button>
                </form>
              )}
              <Link href="/clinic" className="btn ghost">Not now, keep it as a draft</Link>
            </div>
            <p className="help">
              The single post price for {bandInfo(bandForRole(job.role_category)).label.toLowerCase()} roles is charged to the card on your pass once our team approves the job. If we do not approve it, you are not charged.
              {choices.canUpgrade && !owner ? " Only the clinic owner can switch the pass." : ""}
              {choices.canUpgrade && owner ? " Switching bills the difference for the rest of this month at once, and the pass then renews at the Plus price." : ""}
            </p>
          </section>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
