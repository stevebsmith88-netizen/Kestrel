import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppBar from "@/components/AppBar";
import AppFooter from "@/components/AppFooter";
import LocationPicker from "@/components/LocationPicker";
import { requireRole } from "@/lib/auth";
import { getMyClinics, getMyEmployer } from "@/lib/clinic";
import { choosePlan, manageBilling } from "@/lib/pass-actions";
import { passesAvailable, slotsUsed } from "@/lib/pass-flow";
import { PASS_PLANS, passStatusLabel, planByKey } from "@/lib/passes";
import { perPassPost, ROLE_BANDS } from "@/lib/pricing";
import { longDate } from "@/lib/jobs";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Plans | Kestrel Eye Care Jobs", robots: { index: false } };

export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  "pass-started": "Your pass is active. Posts for the roles it covers now go straight to review with nothing to pay.",
  owner: "Only the clinic owner can start or change a pass.",
  already: "This location already has a pass. Use Manage billing to change the card or cancel it.",
  "not-in-stripe": "Passes are not ready on our side yet, because the pass price is missing in Stripe. Please try again soon.",
  failed: "We could not start the pass just now. Nothing has been charged. Please try again in a moment.",
  portal: "Billing management could not open just now. Nothing has changed.",
};

// My clinic, Plans (Steve, 14th November 2026; step 4 of docs/plans/stripe-plan.md). The owner starts a Clinic pass or Clinic pass Plus for the
// location they are working in, and manages the card and cancelling on Stripe's own page. Prices are before HST.
export default async function ClinicPlans({ searchParams }: { searchParams: Promise<{ notice?: string; problem?: string; why?: string }> }) {
  const session = await requireRole("clinic");
  if (!passesAvailable()) redirect("/clinic");
  const employer = await getMyEmployer(session.userId);
  if (!employer) redirect("/clinic/profile");
  const { notice, problem, why } = await searchParams;
  const clinics = await getMyClinics(session.userId);
  const owner = employer.level === "owner";
  const admin = supabaseAdmin();
  const { data: pass } = admin
    ? await admin.from("location_passes").select("plan, status, current_period_end, cancel_at_period_end").eq("employer_id", employer.id).in("status", ["active", "past_due"]).maybeSingle()
    : { data: null };
  const plan = pass ? planByKey(pass.plan) : null;
  const used = pass && admin ? await slotsUsed(admin, employer.id) : 0;
  const prices = ROLE_BANDS.map((b) => b.price);
  const message = NOTICES[problem ?? ""] ?? NOTICES[notice ?? ""];
  return (
    <>
      <AppBar session={session} current="/clinic/plans" />
      <main id="main" tabIndex={-1} className="app">
        <div className="wrap narrow">
          <p className="kicker">{employer.clinic_name}</p>
          <h1>Plans</h1>
          <LocationPicker clinics={clinics} current={employer.id} back="/clinic/plans" />
          <p className="lede2">A pass covers a number of live posts for 1 location, for a monthly price. Single posts are ${Math.min(...prices)} to ${Math.max(...prices)} each. Prices are before HST.</p>
          {message && <p className={problem ? "err form-err" : "notice"} role={problem ? "alert" : "status"}>{message}{problem && why ? ` (For testing only: ${why})` : ""}</p>}

          {pass && plan ? (
            <section className="card">
              <h2>{plan.name}</h2>
              <dl className="facts">
                <div><dt>Status</dt><dd>{passStatusLabel(pass.status, pass.cancel_at_period_end)}</dd></div>
                {pass.current_period_end && <div><dt>{pass.cancel_at_period_end ? "Ends" : "Renews"}</dt><dd>{longDate(pass.current_period_end)}</dd></div>}
                <div><dt>Live posts in use</dt><dd>{used} of {plan.livePosts}</dd></div>
                <div><dt>Covers</dt><dd>{plan.blurb}</dd></div>
              </dl>
              {owner ? (
                <form action={manageBilling}><div className="formbtns"><button type="submit" className="btn ghost">Manage billing, change card or cancel</button></div></form>
              ) : (
                <p className="help">Only the clinic owner can change this pass.</p>
              )}
              <p className="help">Cancel any time. You keep the pass to the end of the month you paid for, and part months are not refunded. Receipts for each month are on Stripe&apos;s billing page, and your single post payments are under <Link href="/clinic/billing">Billing</Link>.</p>
            </section>
          ) : (
            <div className="joblist">
              {PASS_PLANS.map((p) => (
                <section className="card" key={p.key}>
                  <h2>{p.name}</h2>
                  <p><strong>${p.monthly} a month</strong> plus HST, about {perPassPost(p)} a post when all {p.livePosts} are in use.</p>
                  <p>{p.blurb}</p>
                  {owner ? (
                    <form action={choosePlan}>
                      <input type="hidden" name="plan" value={p.key} />
                      <div className="formbtns"><button type="submit" className="btn">Choose {p.name}</button></div>
                    </form>
                  ) : (
                    <p className="help">Only the clinic owner can start a pass.</p>
                  )}
                </section>
              ))}
              <p className="help">A pass renews each month at the same price until you cancel, and the price changes only with 30 days notice. A job the pass does not cover is charged at the single post price to the card on the pass. Nothing is charged until you press Subscribe on Stripe&apos;s page.</p>
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </>
  );
}
