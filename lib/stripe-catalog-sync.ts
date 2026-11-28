import "server-only";
import { CATALOG, LAUNCH_COUPON, priceState, productIds, type PriceState, type StripePriceInfo } from "@/lib/stripe-catalog";
import { StripeError, stripeGet, stripePost } from "@/lib/stripe";

export type CatalogRow = { label: string; cents: number; every?: "month" | "year"; state: PriceState };
export type CatalogStatus = { rows: CatalogRow[]; coupon: boolean; error?: string };

async function existingPrices(key: string): Promise<Map<string, StripePriceInfo>> {
  const found = new Map<string, StripePriceInfo>();
  // Stripe takes at most 10 lookup keys a request.
  const keys = CATALOG.map((c) => c.lookupKey);
  for (let i = 0; i < keys.length; i += 10) {
    const query = keys.slice(i, i + 10).map((k) => `lookup_keys[]=${encodeURIComponent(k)}`).join("&");
    const list = await stripeGet<{ data: (StripePriceInfo & { lookup_key: string })[] }>(`/prices?${query}&active=true&limit=100`, key);
    for (const price of list.data) found.set(price.lookup_key, price);
  }
  return found;
}

async function exists(path: string, key: string): Promise<boolean> {
  try {
    await stripeGet(path, key);
    return true;
  } catch (error) {
    if (error instanceof StripeError && error.status === 404) return false;
    throw error;
  }
}

// Reads Stripe (changes nothing) and says what is there and what is missing.
export async function loadCatalogStatus(key: string): Promise<CatalogStatus> {
  try {
    const found = await existingPrices(key);
    return {
      rows: CATALOG.map((c) => ({ label: c.label, cents: c.cents, every: c.every, state: priceState(c, found.get(c.lookupKey)) })),
      coupon: await exists(`/coupons/${LAUNCH_COUPON.id}`, key),
    };
  } catch (error) {
    return { rows: CATALOG.map((c) => ({ label: c.label, cents: c.cents, every: c.every, state: "missing" as const })), coupon: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Makes Stripe match the catalog. Safe to press again: it only adds what is missing. A price that has changed gets a new price, and
// Stripe moves the lookup key across to it and switches the old one off. Nothing is ever deleted. Returns lines for the admin to read.
export async function syncCatalog(key: string): Promise<string[]> {
  const lines: string[] = [];
  for (const id of productIds()) {
    if (await exists(`/products/${id}`, key)) continue;
    const entry = CATALOG.find((c) => c.productId === id)!;
    await stripePost("/products", key, { id, name: entry.productName, description: entry.productDescription, metadata: { app: "kestrel" } });
    lines.push(`Created product: ${entry.productName}.`);
  }
  const found = await existingPrices(key);
  for (const entry of CATALOG) {
    const state = priceState(entry, found.get(entry.lookupKey));
    if (state === "ok") continue;
    await stripePost("/prices", key, {
      product: entry.productId,
      currency: "cad",
      unit_amount: entry.cents,
      lookup_key: entry.lookupKey,
      transfer_lookup_key: true,
      tax_behavior: "exclusive",
      nickname: entry.label,
      ...(entry.every ? { recurring: { interval: entry.every } } : {}),
    });
    lines.push(`${state === "missing" ? "Created" : "Replaced"} price: ${entry.label}.`);
  }
  if (!(await exists(`/coupons/${LAUNCH_COUPON.id}`, key))) {
    await stripePost("/coupons", key, { id: LAUNCH_COUPON.id, name: LAUNCH_COUPON.name, percent_off: 100, duration: "once", applies_to: { products: LAUNCH_COUPON.appliesToProducts } });
    lines.push("Created the free launch coupon (100% off single posts only).");
  }
  return lines.length ? lines : ["Nothing to do. Stripe already matches the site."];
}
