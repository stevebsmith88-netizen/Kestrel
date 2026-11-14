"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import type { JobFormState } from "@/lib/jobs";
import { StripeError, stripeKey } from "@/lib/stripe";
import { syncCatalog } from "@/lib/stripe-catalog-sync";
import { explainStripeError, secretKeyMode } from "@/lib/stripe-setup";

// The "Create or update in Stripe" button (admin only). It adds the products, prices and free launch coupon that are missing, and
// refuses to run with a live key: prices are switched on in live mode only when Steve says so.
export async function syncStripeCatalog(_prev: JobFormState, _form: FormData): Promise<JobFormState> {
  await requireRole("admin");
  const key = stripeKey();
  if (!key) return { error: "There is no STRIPE_SECRET_KEY on this copy of the site." };
  if (secretKeyMode(key) !== "test") return { error: "This button only works with a test key. Prices are not switched on in live mode yet." };
  try {
    const lines = await syncCatalog(key);
    revalidatePath("/admin/payments");
    return { message: lines.join(" ") };
  } catch (error) {
    if (error instanceof StripeError) return { error: explainStripeError(error.status, error.message) };
    return { error: explainStripeError(null, error instanceof Error ? error.message : String(error)) };
  }
}
