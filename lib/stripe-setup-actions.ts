"use server";

import { requireRole } from "@/lib/auth";
import type { JobFormState } from "@/lib/jobs";
import { StripeError, stripeGet, stripeKey } from "@/lib/stripe";
import { describeAccount, explainStripeError, secretKeyMode } from "@/lib/stripe-setup";

// The Stripe setup box's test button (admin only). It reads the Stripe account and its tax settings, which costs nothing
// and changes nothing, and says plainly whether the key works and what customers will see.
export async function testStripe(_prev: JobFormState, _form: FormData): Promise<JobFormState> {
  await requireRole("admin");
  const key = stripeKey();
  const mode = secretKeyMode(key ?? undefined);
  if (!key) return { error: "There is no STRIPE_SECRET_KEY on this copy of the site. Add it in Vercel for Production and Preview and redeploy without the build cache." };
  if (!mode) return { error: "STRIPE_SECRET_KEY does not look like a Stripe secret key. It should start with sk_test_ (or rk_test_ for a restricted key)." };
  try {
    const account = await stripeGet<Parameters<typeof describeAccount>[0]>("/account", key);
    // Tax settings are a separate permission on a restricted key, so a refusal here does not fail the check.
    const tax = await stripeGet<{ status?: string }>("/tax/settings", key).catch(() => null);
    return { message: describeAccount(account, tax, mode).join(" ") };
  } catch (error) {
    if (error instanceof StripeError) return { error: explainStripeError(error.status, error.message) };
    return { error: explainStripeError(null, error instanceof Error ? error.message : String(error)) };
  }
}
