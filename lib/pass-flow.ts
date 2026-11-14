import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/email";
import { jobPriceCents, bandForRole } from "@/lib/checkout-mode";
import { customerFor, describeFailure } from "@/lib/job-payment-flow";
import { logJobActivity } from "@/lib/job-activity";
import { notifySlack } from "@/lib/notify-slack";
import { passCounts, passDecision, passesOn, planByKey, type PassPlan } from "@/lib/passes";
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
  items?: { data?: { current_period_end?: number }[] };
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

export type PassRow = { id: string; employer_id: string; plan: string; status: string; stripe_subscription_id: string | null; stripe_payment_method_id: string | null; current_period_end: string | null; cancel_at_period_end: boolean };
const PASS_COLUMNS = "id, employer_id, plan, status, stripe_subscription_id, stripe_payment_method_id, current_period_end, cancel_at_period_end";

async function priceId(key: string, lookupKey: string): Promise<string | null> {
  const list = await stripeGet<{ data: { id: string }[] }>(`/prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&active=true&limit=1`, key);
  return list.data[0]?.id ?? null;
}

export type PassStart = { url: string } | { error: "already" | "not-in-stripe" | "failed"; detail?: string };

// Sends the owner to Stripe's page to start a pass. Nothing is charged until they press Subscribe there.
export async function startPassCheckout(employerId: string, planKey: string): Promise<PassStart> {
  const key = stripeKey();
  const db = supabaseAdmin();
  const plan = planByKey(planKey);
  if (!key || !db || !plan) return { error: "failed" };
  try {
    const { data: live } = await db.from("location_passes").select("id").eq("employer_id", employerId).in("status", ["active", "past_due"]).maybeSingle();
    if (live) return { error: "already" };
    const price = await priceId(key, plan.lookupKey);
    if (!price) return { error: "not-in-stripe" };
    const { data: employer } = await db.from("employers").select("clinic_name").eq("id", employerId).maybeSingle();
    const { data: contact } = await db.from("employer_contacts").select("notify_email").eq("employer_id", employerId).maybeSingle();
    const customer = await customerFor(db, key, employerId, employer?.clinic_name ?? "Clinic", contact?.notify_email || null);
    // An abandoned earlier attempt is closed, so it never blocks this one.
    await db.from("location_passes").update({ status: "canceled", updated_at: new Date().toISOString() }).eq("employer_id", employerId).eq("status", "incomplete");
    const { data: row, error } = await db.from("location_passes").insert({ employer_id: employerId, plan: plan.key, status: "incomplete" }).select("id").single();
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
      custom_text: { submit: { message: `${plan.name} is $${plan.monthly} a month plus HST and renews by itself until you cancel. Cancel any time under Plans. You keep the pass to the end of the month you paid for.` } },
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
    const { data: row } = await db.from("location_passes").select("id, employer_id, plan, status").eq("stripe_checkout_session_id", session.id).maybeSingle();
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
    if (firstTime) {
      const { data: employer } = await db.from("employers").select("clinic_name").eq("id", row.employer_id).maybeSingle();
      await notifySlack("A clinic started a pass", [`${plan?.name ?? "Pass"}: ${employer?.clinic_name ?? "A clinic"}`], { path: "/admin/clinics", text: "Open Admin, Clinics" });
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
  const { error } = await db.from("location_passes").update({
    status,
    current_period_end: periodEnd(sub),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    ...(paymentMethodOf(sub) ? { stripe_payment_method_id: paymentMethodOf(sub) } : {}),
    ...(status === "canceled" ? { canceled_at: new Date().toISOString() } : {}),
    updated_at: new Date().toISOString(),
  }).eq("stripe_subscription_id", sub.id);
  if (error) console.error("Pass not updated:", error.code, error.message);
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

// How many jobs the pass covers that are in review or live.
export async function slotsUsed(db: SupabaseClient, employerId: string): Promise<number> {
  const { data: rows } = await db.from("job_payments").select("job_id").eq("employer_id", employerId).eq("status", "covered_by_pass").not("job_id", "is", null);
  const ids = (rows ?? []).map((r) => r.job_id as string);
  if (!ids.length) return 0;
  const { count } = await db.from("jobs").select("id", { count: "exact", head: true }).in("id", ids).in("status", ["in_review", "live"]);
  return count ?? 0;
}

export type PassOutcome = { kind: "none" } | { kind: "covered" } | { kind: "card-on-file"; why: "role" | "full" };

// At submit, once a card is needed: does the location's pass cover this job? If so it is recorded as covered at no charge. If the pass is full or does
// not cover the role, the single post price is recorded against the card already on the pass, so the clinic is not sent to Stripe's page. With no
// pass, or no card on file, nothing changes and the normal card page is used.
export async function applyPassForSubmit(db: SupabaseClient, job: { id: string; title: string; role_category: string | null; employer_id: string }, clinicName: string): Promise<PassOutcome> {
  const { data: existing } = await db.from("job_payments").select("status").eq("job_id", job.id).in("status", ["covered_by_pass", "card_saved"]).maybeSingle();
  if (existing?.status === "covered_by_pass") return { kind: "covered" };
  if (existing?.status === "card_saved") return { kind: "none" };
  const pass = await getActivePass(db, job.employer_id);
  if (!pass) return { kind: "none" };
  const decision = passDecision(pass.plan, job.role_category, await slotsUsed(db, job.employer_id));
  const base = { job_id: job.id, employer_id: job.employer_id, job_title: job.title, clinic_name: clinicName, band: bandForRole(job.role_category) };
  await db.from("job_payments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("job_id", job.id).in("status", ["awaiting_card", "free_launch", "failed"]);
  if (decision.kind === "covered") {
    const { error } = await db.from("job_payments").insert({ ...base, amount_cents: 0, status: "covered_by_pass" });
    if (error) {
      console.error("Pass cover not recorded:", error.code, error.message);
      return { kind: "none" };
    }
    await logJobActivity(db, job.id, `Sent for review, covered by the ${pass.plan.name} (nothing to charge)`, { actor: "clinic" });
    return { kind: "covered" };
  }
  if (!pass.row.stripe_payment_method_id) return { kind: "none" };
  const cents = jobPriceCents(job.role_category);
  const { error } = await db.from("job_payments").insert({ ...base, amount_cents: cents, status: "card_saved", stripe_payment_method_id: pass.row.stripe_payment_method_id });
  if (error) {
    console.error("Card on file not recorded:", error.code, error.message);
    return { kind: "none" };
  }
  await logJobActivity(db, job.id, decision.kind === "full" ? `The ${pass.plan.name} is full, so this post is charged at the single post price to the card on file` : `The ${pass.plan.name} does not cover this role, so this post is charged at the single post price to the card on file`, { actor: "clinic" });
  return { kind: "card-on-file", why: decision.kind === "full" ? "full" : "role" };
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
