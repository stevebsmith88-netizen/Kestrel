// What should exist in Stripe, worked out from lib/pricing.ts so Stripe and the site never disagree (step 2 of docs/plans/stripe-plan.md).
// Pure, so it can be tested (lib/stripe-catalog.test.ts). Prices are in Canadian dollars before HST. Stripe cannot change a price
// once it exists, so a new price is made when a number here changes, and the old one is switched off (see the sync in lib/stripe-catalog-sync.ts).

import { CLINIC_PASS, CLINIC_PASS_PLUS, FREE_LAUNCH_ENDS, POST_DAYS, ROLE_BANDS } from "./pricing.ts";

export type CatalogPrice = {
  lookupKey: string; // how the site finds this price in Stripe, whatever Stripe's own id is
  productId: string; // the product's id, chosen by us so it can be found again
  productName: string;
  productDescription: string;
  label: string; // for the admin page
  cents: number;
  every?: "month" | "year"; // absent for a one time single post
};

const cents = (dollars: number) => Math.round(dollars * 100);

const posts: CatalogPrice[] = ROLE_BANDS.map((band) => ({
  lookupKey: `post_${band.key}_${POST_DAYS}d`,
  productId: `kestrel_post_${band.key}`,
  productName: `Job post, ${band.label.toLowerCase()} (${POST_DAYS} days)`,
  productDescription: `1 job post live for ${POST_DAYS} days on Kestrel Eye Care Jobs. Covers: ${band.covers}.`,
  label: `Single post, ${band.label}`,
  cents: cents(band.price),
}));

function pass(key: string, name: string, covers: string, plan: { monthly: number; yearly: number; livePosts: number }): CatalogPrice[] {
  const base = { productId: `kestrel_${key}`, productName: name, productDescription: `Up to ${plan.livePosts} live job posts at a time, with a featured clinic profile. ${covers}` };
  return [
    { ...base, lookupKey: `${key}_monthly`, label: `${name}, monthly`, cents: cents(plan.monthly), every: "month" },
    { ...base, lookupKey: `${key}_yearly`, label: `${name}, yearly (founding offer)`, cents: cents(plan.yearly), every: "year" },
  ];
}

export const CATALOG: CatalogPrice[] = [
  ...posts,
  ...pass("clinic_pass", "Clinic pass", "Covers support, patient care, optician and practice lead roles.", CLINIC_PASS),
  ...pass("clinic_pass_plus", "Clinic pass Plus", "Covers every role, optometrists included.", CLINIC_PASS_PLUS),
];

// The free launch coupon: 100% off, once, and only on single posts, so a pass is never free.
export const LAUNCH_COUPON = {
  id: "FREE-LAUNCH",
  name: "Free launch",
  appliesToProducts: posts.map((p) => p.productId),
  endsOn: FREE_LAUNCH_ENDS,
};

export const productIds = (): string[] => [...new Set(CATALOG.map((c) => c.productId))];

// What Stripe has for a price, as far as the comparison needs.
export type StripePriceInfo = { id: string; unit_amount: number | null; currency: string; recurring?: { interval?: string } | null; active?: boolean };
export type PriceState = "ok" | "missing" | "different";

export function priceState(entry: CatalogPrice, found: StripePriceInfo | undefined): PriceState {
  if (!found || found.active === false) return "missing";
  const sameAmount = found.unit_amount === entry.cents && found.currency === "cad";
  const sameEvery = (found.recurring?.interval ?? undefined) === entry.every;
  return sameAmount && sameEvery ? "ok" : "different";
}

// The plain line shown for each state.
export function stateText(state: PriceState): string {
  return state === "ok" ? "In Stripe, matches" : state === "missing" ? "Not in Stripe yet" : "In Stripe with a different price";
}

// Today's date as YYYY-MM-DD in Toronto, which is what "the end date" means to Steve and to clinics.
export function todayInToronto(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

// Checkout (step 3) asks this: may the free launch coupon be applied today? True on the end date itself.
export function freeLaunchOpen(now: Date = new Date(), endsOn: string = FREE_LAUNCH_ENDS): boolean {
  return todayInToronto(now) <= endsOn;
}
