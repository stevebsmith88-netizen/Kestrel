import { jobSlackExtras } from "@/lib/slack-approve-buttons";
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/email";
import { refreshJobPages } from "@/lib/job-cache";
import { notifyAdmin } from "@/lib/notify-admin";
import { jobPriceCents, bandForRole } from "@/lib/checkout-mode";
import { customerFor, describeFailure } from "@/lib/job-payment-flow";
import { foundingNumber, sendFoundingThanks } from "@/lib/founding-flow";
import { foundingOfferOpen, lockEnds, yearlyOffered } from "@/lib/founding";
import { logJobActivity } from "@/lib/job-activity";
import { notifySlack } from "@/lib/notify-slack";
import { passCounts, passDecision, passesOn, planByKey, type PassPlan } from "@/lib/passes";
import { FOUNDING_CLINICS } from "@/lib/pricing";
import { StripeError, stripeGet, stripeKey, stripePost } from "@/lib/stripe";
import { secretKeyMode } from "@/lib/stripe-setup";
import { supabaseAdmin } from "@/lib/supabase-server";

// Step 4 of docs/plans/stripe-plan.md: passes. A clinic owner buys a pass for 1 location through Stripe Checkout (a subscription). The website keeps
// a record (location_passes, migration 0051) in step with Stripe through the return page and the webhook. At submit, a job the pass covers goes
// straight to review with no card page and nothing to charge. Every function is for the server only and returns a problem as text.

type StripeSubscription = {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number;
  items?: { data?: { current_period_end?: number; price?: { lookup_key?: string | null } }[] };
  default_payment_method?: string | { id?: string } | null;
  metadata?: { employer_id?: string; plan?: string };
};

const periodEnd = (sub: StripeSubscription): string | null => {
  const t = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return t ? new Date(t * 1000).toISOString() : null;
};

const passStatus = (stripeStatus: string): "active" | "past_due" | "canceled" | "incomplete" =>
  stripeStatus === "active" || stripeStatus === "trialing" ? "active" : stripeStatus === "past_due" || stripeStatus === "unpaid" ? "past_due" : stripeStatus === "canceled" || stripeStatus === "incomplete_expired" ? "canceled" : "incomplete";

const paymentMethodOf = (sub: StripeSubscription): string | null => (typeof sub.default_payment_method === "string" ? sub.default_payment_method : sub.default_payment_method?.id ?? null);

export type PassRow = { id: string; employer_id: string; plan: string; status: string; founding: boolean; billing_interval: string; stripe_schedule_id: string | null; stripe_subscription_id: string | null; stripe_payment_method_id: string | null; current_period_end: string | null; cancel_at_period_end: boolean };
const PASS_COLUMNS = "id, employer_id, plan, status, founding, billing_interval, stripe_schedule_id, stripe_subscription_id, stripe_payment_method_id, current_period_end, cancel_at_period_end";

async function priceId(key: string, lookupKey: string): Promise<string | null> {
  const list = await stripeGet<{ data: { id: string }[] }>(`/prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&active=true&limit=1`, key);
  return list.data[0]?.id ?? null;
}

export type PassStart = { url: string } | { error: "already" | "not-in-stripe" | "yearly" | "failed"; detail?: string };

// Sends the owner to Stripe's page to start a pass. Nothing is charged until they press Subscribe there.
export async function startPassCheckout(employerId: string, planKey: string, interval: "month" | "year" = "month"): Promise<PassStart> {
  const key = stripeKey();
  const db = supabaseAdmin();
  const plan = planByKey(planKey);
  if (!key || !db || !plan) return { error: "failed" };
  try {
    const { data: live } = await db.from("location_passes").select("id").eq("employer_id", employerId).in("status", ["active", "past_due"]).maybeSingle();
    if (live) return { error: "already" };
    // A Founding clinic starting a pass while the launch offer is open keeps its price for 12 months, and may take the yearly option (10 months for
    // the price of 12). Anyone else pays monthly at the price in force.
    const number = await foundingNumber(db, employerId);
    const founding = number !== null && foundingOfferOpen();
    if (interval === "year" && !yearlyOffered({ founding, offerOpen: foundingOfferOpen() })) return { error: "yearly" };
    const price = await priceId(key, interval === "year" ? plan.yearlyLookupKey : plan.lookupKey);
    if (!price) return { error: "not-in-stripe" };
    const { data: employer } = await db.from("employers").select("clinic_name").eq("id", employerId).maybeSingle();
    const { data: contact } = await db.from("employer_contacts").select("notify_email").eq("employer_id", employerId).maybeSingle();
    const customer = await customerFor(db, key, employerId, employer?.clinic_name ?? "Clinic", contact?.notify_email || null);
    // An abandoned earlier attempt is closed, so it never blocks this one.
    await db.from("location_passes").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("employer_id", employerId).eq("status", "incomplete");
    const { data: row, error } = await db.from("location_passes").insert({ employer_id: employerId, plan: plan.key, status: "incomplete", billing_interval: interval, founding }).select("id").single();
    if (error || !row) {
      console.error("Pass row not saved:", error?.code, error?.message);
      return { error: "failed" };
    }
    const meta = { employer_id: employerId, plan: plan.key, pass_id: row.id };
    const session = await stripePost<{ id: string; url: string }>("/checkout/sessions", key, {
      mode: "subscription",
      managed_payments: { enabled: false },
      customer,
      line_items: [{ price, quantity: 1 }],
      success_url: `${SITE_URL}/clinic/plans/done?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/clinic/plans`,
      custom_text: { submit: { message: interval === "year" ? `${plan.name} is $${plan.yearly.toLocaleString("en-CA")} a year plus HST, 10 months for the price of 12, and renews each year at the same price until you cancel. Cancel any time under Plans.` : `${plan.name} is $${plan.monthly} a month plus HST and renews by itself until you cancel. Cancel any time under Plans. You keep the pass to the end of the month you paid for.${founding ? " As a Founding clinic your price is kept for 12 months." : ""}` } },
      metadata: meta,
      subscription_data: { metadata: meta },
    }, { idempotencyKey: `kestrel-pass-${row.id}` });
    await db.from("location_passes").update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() }).eq("id", row.id);
    return { url: session.url };
  } catch (e) {
    console.error("Pass checkout failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
    return { error: "failed", detail: secretKeyMode(key) === "test" ? describeFailure(e) : undefined };
  }
}

export type PassDone = { planName: string; employerId: string; firstTime: boolean } | { error: string };

// Stripe has the subscription. Called by the page Stripe sends the clinic back to and by the webhook; whichever comes first does the work and
// the other finds it done. Reads the session from Stripe itself, never trusting the web address.
export async function completePassCheckout(sessionId: string): Promise<PassDone> {
  const key = stripeKey();
  const db = supabaseAdmin();
  if (!key || !db) return { error: "Payments are not set up on this copy of the site." };
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return { error: "That link is not valid." };
  try {
    const session = await stripeGet<{ id: string; mode: string; status: string; subscription: StripeSubscription | string | null }>(`/checkout/sessions/${sessionId}?expand[]=subscription`, key);
    const sub = session.subscription && typeof session.subscription === "object" ? session.subscription : null;
    if (session.mode !== "subscription" || session.status !== "complete" || !sub) return { error: "The pass was not started, so nothing has changed." };
    const { data: row } = await db.from("location_passes").select("id, employer_id, plan, status, founding, billing_interval").eq("stripe_checkout_session_id", session.id).maybeSingle();
    if (!row) return { error: "We could not match that to one of your passes." };
    const plan = planByKey(row.plan);
    const firstTime = row.status === "incomplete";
    await db.from("location_passes").update({
      status: passStatus(sub.status),
      stripe_subscription_id: sub.id,
      stripe_payment_method_id: paymentMethodOf(sub),
      current_period_end: periodEnd(sub),
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);
    if (firstTime && row.founding && plan) {
      // A Founding clinic's price is locked for 12 months from now, or the yearly price simply stays. The lock is also kept in Stripe as a schedule that
      // moves the pass to the price in force afterwards; if that cannot be made, the pass still works and Steve is told.
      const monthly = row.billing_interval !== "year";
      const lockedUntil = monthly ? lockEnds(new Date()).toISOString() : null;
      await db.from("location_passes").update({ price_locked_until: lockedUntil }).eq("id", row.id);
      if (monthly) {
        try {
          await lockFoundingPrice(db, key, sub.id, plan, row.id);
        } catch (e) {
          console.error("Founding price lock failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
          await notifySlack("Could not lock a Founding clinic's price in Stripe", [plan.name, secretKeyMode(key) === "test" ? describeFailure(e) : "See the website logs"], { path: "/admin/payments", text: "Open Admin, Payments" }, "jobs");
        }
      }
      await sendFoundingThanks(db, { id: row.id, employer_id: row.employer_id, plan: row.plan, billing_interval: row.billing_interval, price_locked_until: lockedUntil });
    }
    if (firstTime) {
      const { data: employer } = await db.from("employers").select("clinic_name").eq("id", row.employer_id).maybeSingle();
      await notifySlack("A clinic started a pass", [`${plan?.name ?? "Pass"}: ${employer?.clinic_name ?? "A clinic"}`], { path: "/admin/clinics", text: "Open Admin, Clinics" }, "jobs");
    }
    return { planName: plan?.name ?? "Pass", employerId: row.employer_id, firstTime };
  } catch (e) {
    console.error("Pass check failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
    return { error: "We could not check the pass just now. If you finished on Stripe's page, it will appear here shortly." };
  }
}

// Keeps a pass in step with Stripe: used by the webhook (a renewal, a cancellation, a failed payment) and when a pass looks out of date.
export async function syncPassFromSubscription(sub: StripeSubscription): Promise<void> {
  const db = supabaseAdmin();
  if (!db || !sub?.id) return;
  const status = passStatus(sub.status);
  const lookup = sub.items?.data?.[0]?.price?.lookup_key;
  const planFromPrice = lookup === "clinic_pass_plus_monthly" || lookup === "clinic_pass_plus_yearly" ? "clinic_pass_plus" : lookup === "clinic_pass_monthly" || lookup === "clinic_pass_yearly" ? "clinic_pass" : null;
  const { error } = await db.from("location_passes").update({
    ...(planFromPrice ? { plan: planFromPrice } : {}),
    status,
    current_period_end: periodEnd(sub),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    ...(paymentMethodOf(sub) ? { stripe_payment_method_id: paymentMethodOf(sub) } : {}),
    ...(status === "canceled" ? { canceled_at: new Date().toISOString() } : {}),
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", sub.id);
  if (error) console.error("Pass not updated:", error.code, error.message);
}

type StripeSchedule = { id: string; phases: { start_date: number; items: { price: string | { id: string } }[] }[] };

// Keeps a Founding clinic's monthly price for 12 months, then moves the pass to the price in force, with a Stripe subscription schedule (phase 1 at the
// price it started on for 12 months, phase 2 at the price in force). Today those are the same price; when prices change the second phase is updated.
async function lockFoundingPrice(db: SupabaseClient, key: string, subscriptionId: string, plan: PassPlan, passId: string): Promise<void> {
  const schedule = await stripePost<StripeSchedule>("/subscription_schedules", key, { from_subscription: subscriptionId }, { idempotencyKey: `kestrel-lock-${passId}` });
  const first = schedule.phases[0];
  const current = first.items[0].price;
  const currentId = typeof current === "string" ? current : current.id;
  const inForce = (await priceId(key, plan.lookupKey)) ?? currentId;
  await stripePost(`/subscription_schedules/${schedule.id}`, key, {
    end_behavior: "release",
    phases: [
      { items: [{ price: currentId, quantity: 1 }], start_date: first.start_date, iterations: FOUNDING_CLINICS.lockMonths },
      { items: [{ price: inForce, quantity: 1 }], iterations: 1 },
    ],
  }, { idempotencyKey: `kestrel-lock-phases-${passId}` });
  await db.from("location_passes").update({ stripe_schedule_id: schedule.id }).eq("id", passId);
}

// The location's pass if it covers anything right now. A pass whose paid month has run out is checked with Stripe first, in case the renewal
// message has not arrived yet.
export async function getActivePass(db: SupabaseClient, employerId: string): Promise<{ row: PassRow; plan: PassPlan } | null> {
  const { data } = await db.from("location_passes").select(PASS_COLUMNS).eq("employer_id", employerId).in("status", ["active", "past_due"]).maybeSingle();
  let row = data as PassRow | null;
  if (!row) return null;
  const key = stripeKey();
  if (key && row.stripe_subscription_id && (!row.current_period_end || new Date(row.current_period_end).getTime() < Date.now())) {
    try {
      await syncPassFromSubscription(await stripeGet<StripeSubscription>(`/subscriptions/${row.stripe_subscription_id}`, key));
      const { data: fresh } = await db.from("location_passes").select(PASS_COLUMNS).eq("employer_id", employerId).in("status", ["active", "past_due"]).maybeSingle();
      row = fresh as PassRow | null;
    } catch (e) {
      console.error("Pass refresh failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
    }
  }
  const plan = row ? planByKey(row.plan) : null;
  return row && plan && passCounts(row.status) ? { row, plan } : null;
}

// How many jobs the pass covers right now. A covered job keeps its slot while it is in review, live, or taken back into the drafts, so posting and
// withdrawing cannot be used to free a slot. A slot is freed when the job is closed or has run its 30 days, is deleted, or is sent back.
export async function slotsUsed(db: SupabaseClient, employerId: string): Promise<number> {
  const { data: rows } = await db.from("job_payments").select("job_id").eq("employer_id", employerId).eq("status", "covered_by_pass").not("job_id", "is", null);
  const ids = (rows ?? []).map((r) => r.job_id as string);
  if (!ids.length) return 0;
  const { count } = await db.from("jobs").select("id", { count: "exact", head: true }).in("id", ids).in("status", ["in_review", "live", "draft"]);
  return count ?? 0;
}

// The pass and how much of it is in use, for the dashboard, the post form and the confirm page.
export async function passUsage(db: SupabaseClient | null, employerId: string): Promise<{ planName: string; planKey: string; used: number; limit: number } | null> {
  if (!db) return null;
  const pass = await getActivePass(db, employerId);
  if (!pass) return null;
  return { planName: pass.plan.name, planKey: pass.plan.key, used: await slotsUsed(db, employerId), limit: pass.plan.livePosts };
}

export type PassOutcome = { kind: "none" } | { kind: "covered" } | { kind: "choose"; why: "role" | "full" };

// At submit, once a card would be needed: does the location's pass cover this job? If so it is recorded as covered at no charge. If the pass is full
// or does not cover the role, nothing is recorded or charged: the clinic is asked first what it wants (a confirm page: pay the single post price
// to the card on the pass, or switch to Plus). With no pass, nothing changes and the normal card page is used.
export async function applyPassForSubmit(db: SupabaseClient, job: { id: string; title: string; role_category: string | null; employer_id: string }, clinicName: string): Promise<PassOutcome> {
  const { data: existing } = await db.from("job_payments").select("status").eq("job_id", job.id).in("status", ["covered_by_pass", "card_saved"]).maybeSingle();
  if (existing?.status === "covered_by_pass") return { kind: "covered" };
  if (existing?.status === "card_saved") return { kind: "none" };
  const pass = await getActivePass(db, job.employer_id);
  if (!pass) return { kind: "none" };
  // The job's own slot does not count against it: a covered job taken back into the drafts and sent again was handled above.
  const decision = passDecision(pass.plan, job.role_category, await slotsUsed(db, job.employer_id));
  if (decision.kind !== "covered") return { kind: "choose", why: decision.kind === "full" ? "full" : "role" };
  await db.from("job_payments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("job_id", job.id).in("status", ["awaiting_card", "free_launch", "failed"]);
  const { error } = await db.from("job_payments").insert({ job_id: job.id, employer_id: job.employer_id, job_title: job.title, clinic_name: clinicName, band: bandForRole(job.role_category), amount_cents: 0, status: "covered_by_pass" });
  if (error) {
    console.error("Pass cover not recorded:", error.code, error.message);
    return { kind: "none" };
  }
  await logJobActivity(db, job.id, `Sent for review, covered by the ${pass.plan.name} (nothing to charge)`, { actor: "clinic" });
  return { kind: "covered" };
}

// The clinic chose to pay the single post price for a job its pass cannot cover. Recorded against the card already on the pass, and charged when the
// job is approved like any other post.
export async function confirmSinglePost(db: SupabaseClient, job: { id: string; title: string; role_category: string | null; employer_id: string }, clinicName: string): Promise<boolean> {
  const pass = await getActivePass(db, job.employer_id);
  if (!pass?.row.stripe_payment_method_id) return false;
  await db.from("job_payments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("job_id", job.id).in("status", ["awaiting_card", "free_launch", "failed"]);
  const { error } = await db.from("job_payments").insert({ job_id: job.id, employer_id: job.employer_id, job_title: job.title, clinic_name: clinicName, band: bandForRole(job.role_category), amount_cents: jobPriceCents(job.role_category), status: "card_saved", stripe_payment_method_id: pass.row.stripe_payment_method_id });
  if (error) {
    console.error("Card on file not recorded:", error.code, error.message);
    return false;
  }
  await logJobActivity(db, job.id, `The clinic chose to pay the single post price, charged to the card on the ${pass.plan.name} when approved`, { actor: "clinic" });
  return true;
}

// Sends a draft job into the review queue and tells Steve. Used once the payment side of a job is settled.
export async function moveToReview(db: SupabaseClient, job: { id: string; title: string }, clinicName: string): Promise<void> {
  await db.from("jobs").update({ status: "in_review" }).eq("id", job.id).eq("status", "draft");
  await notifyAdmin("A job is waiting for review", [job.title, clinicName], "/admin/review");
  const extra = await jobSlackExtras(db, job.id);
  await notifySlack("A job is waiting for review", [job.title, clinicName, ...extra.lines], { path: "/admin/review", text: "Open the review queue" }, "jobs", extra.buttons);
  refreshJobPages();
}

// Moves a location from the Clinic pass to Clinic pass Plus now. Stripe works out the part month and bills the difference at once.
export async function switchPassPlan(employerId: string, toKey: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const key = stripeKey();
  const db = supabaseAdmin();
  const to = planByKey(toKey);
  if (!key || !db || !to) return { ok: false, message: "The pass could not be changed just now." };
  const pass = await getActivePass(db, employerId);
  if (!pass?.row.stripe_subscription_id) return { ok: false, message: "There is no active pass to change." };
  if (pass.plan.key === to.key) return { ok: true };
  try {
    if (pass.row.stripe_schedule_id) {
      // A subscription held by a schedule cannot be changed, so the schedule is released first. The founding lock does not carry over to Plus
      // (docs/pass-procedures.md).
      try {
        await stripePost(`/subscription_schedules/${pass.row.stripe_schedule_id}/release`, key, {});
      } catch (e) {
        console.error("Schedule release failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
      }
      await db.from("location_passes").update({ stripe_schedule_id: null, price_locked_until: null }).eq("id", pass.row.id);
    }
    const sub = await stripeGet<StripeSubscription & { items: { data: { id: string }[] } }>(`/subscriptions/${pass.row.stripe_subscription_id}`, key);
    const item = sub.items.data[0]?.id;
    const price = await priceId(key, to.lookupKey);
    if (!item || !price) return { ok: false, message: "The pass price is not ready in Stripe yet." };
    const updated = await stripePost<StripeSubscription>(`/subscriptions/${pass.row.stripe_subscription_id}`, key, {
      items: [{ id: item, price }],
      proration_behavior: "always_invoice",
      payment_behavior: "error_if_incomplete",
      metadata: { employer_id: employerId, plan: to.key },
    }, { idempotencyKey: `kestrel-switch-${pass.row.id}-${to.key}-${Math.floor(Date.now() / 600_000)}` });
    await db.from("location_passes").update({ plan: to.key, current_period_end: periodEnd(updated) ?? pass.row.current_period_end, updated_at: new Date().toISOString() }).eq("id", pass.row.id);
    await notifySlack("A clinic switched pass", [`${pass.plan.name} to ${to.name}`], { path: "/admin/clinics", text: "Open Admin, Clinics" }, "jobs");
    return { ok: true };
  } catch (e) {
    console.error("Pass switch failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
    const reason = e instanceof StripeError && e.type === "card_error" ? "The card on the pass was refused for the difference, so the pass was not changed." : "The pass could not be changed just now, and nothing has been charged.";
    return { ok: false, message: secretKeyMode(key) === "test" ? `${reason} (For testing only: ${describeFailure(e)})` : reason };
  }
}

// Stripe's own page for changing the card, seeing invoices and cancelling. Needs the customer portal switched on in the Stripe dashboard.
export async function openBillingPortal(employerId: string): Promise<{ url: string } | { error: string }> {
  const key = stripeKey();
  const db = supabaseAdmin();
  if (!key || !db) return { error: "Payments are not set up on this copy of the site." };
  const { data: billing } = await db.from("employer_billing").select("stripe_customer_id").eq("employer_id", employerId).maybeSingle();
  if (!billing?.stripe_customer_id) return { error: "There is nothing to manage yet." };
  try {
    const session = await stripePost<{ url: string }>("/billing_portal/sessions", key, { customer: billing.stripe_customer_id, return_url: `${SITE_URL}/clinic/plans` });
    return { url: session.url };
  } catch (e) {
    console.error("Billing portal failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
    return { error: secretKeyMode(key) === "test" ? `Billing management could not open (for testing only: ${describeFailure(e)})` : "Billing management could not open just now. Please try again in a moment, or write to us under Help and feedback." };
  }
}

// Are passes offered on this copy of the site? A live Stripe key, or a trial with a test key (FORCE_PAID_CHECKOUT) on the demo.
export function passesAvailable(): boolean {
  return passesOn({ keyMode: secretKeyMode(stripeKey() ?? undefined), force: process.env.FORCE_PAID_CHECKOUT === "yes" });
}
