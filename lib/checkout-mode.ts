// Step 3 of docs/plans/stripe-plan.md: when is a clinic asked for a card, and what does a job cost? Pure, so it can be tested
// (lib/checkout-mode.test.ts). The card is saved when the job is sent for review and charged only when Kestrel approves it.

import { ROLE_BANDS } from "./pricing.ts";

export type BandKey = (typeof ROLE_BANDS)[number]["key"];

// Which price band a job's role falls in (lib/pricing.ts). Steve decides the roles the ladder does not name: a vision therapist and the
// field roles (sales, trainers, field service, account managers) are put in the middle band for now, and "unknown" is never cheaper than that.
export function bandForRole(role: string | null | undefined): BandKey {
  switch (role) {
    case "Optometrist":
      return "optometrists";
    case "Optometric assistant or technician":
    case "Patient care or reception":
      return "support";
    default:
      return "opticians";
  }
}

export function bandInfo(key: BandKey) {
  return ROLE_BANDS.find((b) => b.key === key)!;
}

// What a job costs, in cents, before HST, from the role it is for. Taken from lib/pricing.ts, the same numbers Stripe was given.
export function jobPriceCents(role: string | null | undefined): number {
  return Math.round(bandInfo(bandForRole(role)).price * 100);
}

export type PaymentMode = "free" | "card";

// A card is asked for only when money is due (Steve, 6th November 2026: no card during the free launch). A live Stripe key is the sign
// that prices are switched on, so after the free launch ends a card is asked for only with a live key. A test key asks for a card only
// when FORCE_PAID_CHECKOUT is yes, so Steve can try it on the demo site during the free launch.
export function paymentMode(args: { freeLaunchOpen: boolean; keyMode: "test" | "live" | null; force: boolean }): PaymentMode {
  if (!args.keyMode) return "free";
  if (args.force) return "card";
  if (args.freeLaunchOpen) return "free";
  return args.keyMode === "live" ? "card" : "free";
}

// The line shown on Stripe's page beside the button, so nobody thinks they are charged at once.
export function chargeNotice(cents: number): string {
  const dollars = (cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `You are not charged now. We charge $${dollars} plus HST when Kestrel approves your post. If we do not approve it, you are never charged.`;
}

// A flag for the reviewer when the title says optometrist but the role chosen, and so the price paid, is a lower band (Steve, 14th
// November 2026). It reads the title only: the word often appears in an honest advert's description, so the description is never searched.
export function bandMismatchFlag(title: string, role: string | null | undefined): string | null {
  const says = /\boptometrists?\b|\bO\.?D\.?\b|\bdoctor of optometry\b/i.test(title);
  if (!says || bandForRole(role) === "optometrists") return null;
  return `The title mentions an optometrist, but the role chosen is "${role ?? "none"}", which is priced in a lower band. Check the role before approving, and change it if this is an optometrist job.`;
}

type PaymentRow = { status: string; amount_cents: number; band: string; failure_message: string | null };

const dollars = (cents: number) => "$" + (cents / 100).toLocaleString("en-CA", { minimumFractionDigits: cents % 100 ? 2 : 0 });

// What the reviewer reads beside a job about its payment. `role` is the role as it stands now, since that sets the price charged on approval.
export function paymentLine(row: PaymentRow | null | undefined, role: string | null | undefined): string {
  const now = bandInfo(bandForRole(role));
  const price = dollars(jobPriceCents(role));
  if (!row) return "No payment recorded (a post from before checkout, or a database without the payments table).";
  switch (row.status) {
    case "free_launch":
      return "Free launch post. Nothing to charge.";
    case "awaiting_card":
      return "The clinic has not saved a card yet.";
    case "card_saved":
      return `Card saved. Approving charges ${price} plus HST (${now.label} band).${row.band !== now.key ? " The role has changed since the card was saved, so the price follows the role now." : ""}`;
    case "charged":
      return `Charged ${dollars(row.amount_cents)} plus HST.`;
    case "failed":
      return `The card was refused${row.failure_message ? ` (${row.failure_message})` : ""}. The clinic has been asked to save a new card.`;
    default:
      return "Cancelled. Nothing was charged.";
  }
}
