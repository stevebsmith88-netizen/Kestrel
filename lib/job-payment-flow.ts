import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/email";
import { refreshJobPages } from "@/lib/job-cache";
import { notifyAdmin } from "@/lib/notify-admin";
import { bandForRole, chargeNotice, jobPriceCents, paymentMode, type PaymentMode } from "@/lib/checkout-mode";
import { StripeError, stripeGet, stripeKey, stripePost } from "@/lib/stripe";
import { freeLaunchOpen } from "@/lib/stripe-catalog";
import { secretKeyMode } from "@/lib/stripe-setup";
import { supabaseAdmin } from "@/lib/supabase-server";

// Step 3 of docs/plans/stripe-plan.md. A clinic sends a job for review; after the free launch Stripe's page saves a card without charging
// it; when Kestrel approves the job the saved card is charged for the price of the role. Every function here is for the server only,
// uses the server key, and never stops a job from being reviewed because something went wrong with Stripe: a problem is returned as text.

export function currentPaymentMode(): PaymentMode {
  return paymentMode({ freeLaunchOpen: freeLaunchOpen(), keyMode: secretKeyMode(stripeKey() ?? undefined), force: process.env.FORCE_PAID_CHECKOUT === "yes" });
}

type JobForPayment = { id: string; title: string; role_category: string | null; employer_id: string; status: string };

async function loadJob(db: SupabaseClient, jobId: string): Promise<{ job: JobForPayment; clinicName: string; email: string | null } | null> {
  const { data: job } = await db.from("jobs").select("id, title, role_category, employer_id, status").eq("id", jobId).maybeSingle();
  if (!job) return null;
  const { data: employer } = await db.from("employers").select("clinic_name").eq("id", job.employer_id).maybeSingle();
  const { data: contact } = await db.from("employer_contacts").select("notify_email").eq("employer_id", job.employer_id).maybeSingle();
  return { job: job as JobForPayment, clinicName: employer?.clinic_name ?? "Clinic", email: contact?.notify_email || null };
}

// The Stripe customer for a clinic: made once, then reused for every post.
async function customerFor(db: SupabaseClient, key: string, employerId: string, clinicName: string, email: string | null): Promise<string> {
  const { data: have } = await db.from("employer_billing").select("stripe_customer_id").eq("employer_id", employerId).maybeSingle();
  if (have?.stripe_customer_id) return have.stripe_customer_id;
  const customer = await stripePost<{ id: string }>("/customers", key, { name: clinicName, ...(email ? { email } : {}), metadata: { employer_id: employerId } }, { idempotencyKey: `kestrel-customer-${employerId}` });
  const { error } = await db.from("employer_billing").insert({ employer_id: employerId, stripe_customer_id: customer.id });
  if (error) {
    // Another request made the row first: use theirs.
    const { data: other } = await db.from("employer_billing").select("stripe_customer_id").eq("employer_id", employerId).maybeSingle();
    if (other?.stripe_customer_id) return other.stripe_customer_id;
    throw new Error(error.message);
  }
  return customer.id;
}

// What went wrong, in 1 line, with any Stripe key removed.
export function describeFailure(e: unknown): string {
  const text = e instanceof StripeError ? `Stripe ${e.status ?? "no answer"}: ${e.message}` : e instanceof Error ? e.message : String(e);
  return text.replace(/\b(?:sk|rk|pk)_(?:test|live)_[A-Za-z0-9*]+/g, "[key]").slice(0, 300);
}

export type CardSetupResult = { url: string } | { alreadySaved: true } | { error: string };

// Sends a clinic to Stripe's page to save a card for a job. Nothing is charged. If a card is already saved for the job, it says so.
export async function startCardSetup(jobId: string, returnTo: "submit" | "update" = "submit"): Promise<CardSetupResult> {
  const key = stripeKey();
  const db = supabaseAdmin();
  if (!key || !db) return { error: "Payments are not set up on this copy of the site." };
  try {
    const loaded = await loadJob(db, jobId);
    if (!loaded) return { error: "We could not find that job." };
    const { job, clinicName, email } = loaded;

    const { data: saved } = await db.from("job_payments").select("id").eq("job_id", jobId).eq("status", "card_saved").maybeSingle();
    if (saved) return { alreadySaved: true };
    // An abandoned earlier attempt is closed, so only 1 payment is in play for the job.
    await db.from("job_payments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("job_id", jobId).in("status", ["awaiting_card", "free_launch"]);

    const cents = jobPriceCents(job.role_category);
    const { data: payment, error } = await db
      .from("job_payments")
      .insert({ job_id: job.id, employer_id: job.employer_id, job_title: job.title, clinic_name: clinicName, band: bandForRole(job.role_category), amount_cents: cents, status: "awaiting_card" })
      .select("id")
      .single();
    if (error || !payment) {
      console.error("Payment row not saved:", error?.code, error?.message);
      return { error: "We could not start the payment. Please try again in a moment." };
    }

    const customer = await customerFor(db, key, job.employer_id, clinicName, email);
    const meta = { payment_id: payment.id, job_id: job.id, employer_id: job.employer_id };
    const session = await stripePost<{ id: string; url: string }>("/checkout/sessions", key, {
      mode: "setup",
      // Managed Payments (Stripe acting as the seller) is on by default on the account and only supports payment and subscription mode, not
      // saving a card for later. It is turned off for this request only. Whether to use it for passes is Steve's decision (docs/plans/stripe-plan.md).
      managed_payments: { enabled: false },
      currency: "cad",
      customer,
      // Stripe no longer accepts payment_method_types on Checkout: the methods offered are set in the Stripe dashboard (Settings, Payment
      // methods). In setup mode only methods that can be saved and charged later are shown.
      success_url: `${SITE_URL}/clinic/jobs/paid?session_id={CHECKOUT_SESSION_ID}&from=${returnTo}`,
      cancel_url: `${SITE_URL}/clinic/jobs/paid?cancelled=${job.id}`,
      custom_text: { submit: { message: chargeNotice(cents) } },
      metadata: meta,
      setup_intent_data: { metadata: meta, description: `Card saved for the job post "${job.title}"` },
    }, { idempotencyKey: `kestrel-setup-${payment.id}` });
    await db.from("job_payments").update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() }).eq("id", payment.id);
    return { url: session.url };
  } catch (e) {
    console.error("Card setup failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
    // With a test key (the demo, or a trial) the real reason is shown, so a mistake in the set up can be found at once. Never with a live key.
    const detail = secretKeyMode(key) === "test" ? ` (For testing only: ${describeFailure(e)})` : "";
    return { error: `We could not reach our payment provider just now. Your job is saved as a draft. Please try sending it again in a moment.${detail}` };
  }
}

export type SetupDone = { jobId: string; employerId: string; title: string; sentForReview: boolean } | { error: string };

// Stripe has the card. Called by the page Stripe sends the clinic back to, and by the webhook (lib/stripe-webhook.ts): whichever comes first
// does the work and the other finds it done, so it is safe to call twice. Reads the session from Stripe itself rather than trusting the web address.
export async function completeCardSetup(sessionId: string): Promise<SetupDone> {
  const key = stripeKey();
  const db = supabaseAdmin();
  if (!key || !db) return { error: "Payments are not set up on this copy of the site." };
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return { error: "That payment link is not valid." };
  try {
    const session = await stripeGet<{ id: string; mode: string; status: string; setup_intent: { payment_method?: string | null; status?: string } | string | null }>(`/checkout/sessions/${sessionId}?expand[]=setup_intent`, key);
    if (session.mode !== "setup") return { error: "That payment link is not for saving a card." };
    const intent = session.setup_intent && typeof session.setup_intent === "object" ? session.setup_intent : null;
    if (session.status !== "complete" || !intent?.payment_method || intent.status !== "succeeded") return { error: "The card was not saved, so nothing has been sent for review." };

    const { data: payment } = await db.from("job_payments").select("id, job_id, employer_id, status, job_title").eq("stripe_checkout_session_id", session.id).maybeSingle();
    if (!payment || !payment.job_id) return { error: "We could not match that payment to a job." };
    // Whichever of the return page and the webhook gets here first does the work, and only that one tells Kestrel about it.
    const { data: first } = await db.from("job_payments").update({ status: "card_saved", stripe_payment_method_id: intent.payment_method, updated_at: new Date().toISOString() }).eq("id", payment.id).eq("status", "awaiting_card").select("id");
    // A new job goes into the review queue now. A job already in review (the clinic updated a card that was refused) just stays there.
    const { data: moved } = await db.from("jobs").update({ status: "in_review" }).eq("id", payment.job_id).eq("status", "draft").select("id");
    if (moved?.length) refreshJobPages();
    if (first?.length) {
      await notifyAdmin(moved?.length ? "A job is waiting for review" : "A clinic updated the card for a job in review", [payment.job_title], "/admin/review");
    }
    return { jobId: payment.job_id, employerId: payment.employer_id, title: payment.job_title, sentForReview: Boolean(moved?.length) };
  } catch (e) {
    console.error("Card setup check failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
    return { error: "We could not check the payment just now. If your card was saved, your job will still reach our team. Otherwise please try again." };
  }
}

export type ChargeResult = { ok: true; charged: boolean; cents: number } | { ok: false; message: string };

// Called when Kestrel approves a job. If a card is saved for it, charges the price of the role and returns ok. A job with no payment record
// (posted before checkout existed, or during the free launch) needs no charge. Never charges twice: the idempotency key repeats the same answer.
export async function chargeForJob(jobId: string): Promise<ChargeResult> {
  const db = supabaseAdmin();
  if (!db) return { ok: true, charged: false, cents: 0 };
  const { data: rows } = await db.from("job_payments").select("id, employer_id, status, stripe_payment_method_id, amount_cents").eq("job_id", jobId).in("status", ["card_saved", "charged", "free_launch", "awaiting_card", "failed"]).order("created_at", { ascending: false });
  const list = rows ?? [];
  const ready = list.find((r) => r.status === "card_saved");
  if (!ready) {
    if (list.some((r) => r.status === "awaiting_card")) return { ok: false, message: "The clinic has not saved a card for this job yet." };
    if (list[0]?.status === "failed") return { ok: false, message: "The card was refused last time and the clinic has not updated it yet." };
    return { ok: true, charged: false, cents: 0 };
  }
  const key = stripeKey();
  if (!key) return { ok: false, message: "Stripe is not set up on this copy of the site, so the saved card cannot be charged." };
  const loaded = await loadJob(db, jobId);
  if (!loaded) return { ok: false, message: "We could not find the job." };
  const { job, clinicName, email } = loaded;
  const { data: billing } = await db.from("employer_billing").select("stripe_customer_id").eq("employer_id", ready.employer_id).maybeSingle();
  if (!billing?.stripe_customer_id || !ready.stripe_payment_method_id) return { ok: false, message: "No saved card was found for this clinic." };

  // The price follows the role as it stands now, so a role changed in review is charged at the right band.
  const cents = jobPriceCents(job.role_category);
  const band = bandForRole(job.role_category);
  try {
    const intent = await stripePost<{ id: string; status: string }>("/payment_intents", key, {
      amount: cents,
      currency: "cad",
      customer: billing.stripe_customer_id,
      payment_method: ready.stripe_payment_method_id,
      payment_method_types: ["card"],
      confirm: true,
      off_session: true,
      description: `Kestrel Eye Care Jobs: ${job.title} (30 day post)`,
      metadata: { payment_id: ready.id, job_id: job.id, employer_id: job.employer_id, clinic: clinicName },
      ...(email ? { receipt_email: email } : {}),
    }, { idempotencyKey: `kestrel-charge-${ready.id}-${cents}` });
    if (intent.status !== "succeeded") {
      const message = "The card needs the cardholder to confirm it, so it could not be charged without them.";
      await db.from("job_payments").update({ status: "failed", failure_message: message, stripe_payment_intent_id: intent.id, updated_at: new Date().toISOString() }).eq("id", ready.id);
      return { ok: false, message };
    }
    await db.from("job_payments").update({ status: "charged", amount_cents: cents, band, stripe_payment_intent_id: intent.id, failure_message: null, charged_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", ready.id);
    return { ok: true, charged: true, cents };
  } catch (e) {
    const message = (e instanceof StripeError ? e.message : "Stripe could not be reached").replace(/\b(?:sk|rk|pk)_(?:test|live)_[A-Za-z0-9*]+/g, "[key]").slice(0, 200);
    console.error("Charge failed:", e instanceof StripeError ? `${e.status} ${e.message}` : e);
    if (e instanceof StripeError && e.status !== null && e.status < 500) {
      await db.from("job_payments").update({ status: "failed", failure_message: message, updated_at: new Date().toISOString() }).eq("id", ready.id);
    }
    return { ok: false, message };
  }
}

// The job was not approved, so a saved card is never charged. Safe to call for any job.
export async function cancelPaymentForJob(db: SupabaseClient, jobId: string): Promise<void> {
  await db.from("job_payments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("job_id", jobId).in("status", ["awaiting_card", "card_saved", "free_launch", "failed"]);
}

// A job that goes to review with no card to save (the free launch, or no Stripe key) leaves a record, so the sales page can count free posts.
export async function recordFreeLaunchPost(db: SupabaseClient, job: { id: string; title: string; role_category: string | null; employer_id: string }, clinicName: string): Promise<void> {
  try {
    await db.from("job_payments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("job_id", job.id).in("status", ["awaiting_card"]);
    const { error } = await db.from("job_payments").insert({ job_id: job.id, employer_id: job.employer_id, job_title: job.title, clinic_name: clinicName, band: bandForRole(job.role_category), amount_cents: 0, status: "free_launch" });
    // A job that already has a payment in play (a resubmission) is fine, and a database without migration 0048 is fine too.
    if (error && error.code !== "23505" && error.code !== "42P01" && error.code !== "PGRST205") console.error("Free launch record not saved:", error.code, error.message);
  } catch (e) {
    console.error("Free launch record not saved:", e instanceof Error ? e.message : e);
  }
}
