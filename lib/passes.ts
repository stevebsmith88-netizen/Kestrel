// What a pass covers and when a job is covered by one (step 4 of docs/plans/stripe-plan.md). Pure, so it can be tested (lib/passes.test.ts).
// Prices and the 5 live posts come from lib/pricing.ts, the same numbers Stripe was given. The Clinic pass covers support, patient care, optician and
// practice lead roles; Clinic pass Plus covers every role, optometrists included. 1 pass belongs to 1 location.

import { bandForRole, type BandKey } from "./checkout-mode.ts";
import { CLINIC_PASS, CLINIC_PASS_PLUS } from "./pricing.ts";

export type PassPlanKey = "clinic_pass" | "clinic_pass_plus";

export type PassPlan = {
  key: PassPlanKey;
  name: string;
  monthly: number;
  livePosts: number;
  yearly: number;
  lookupKey: string; // the Stripe price (lib/stripe-catalog.ts)
  yearlyLookupKey: string;
  covers: BandKey[];
  blurb: string;
};

export const PASS_PLANS: PassPlan[] = [
  { key: "clinic_pass", name: "Clinic pass", monthly: CLINIC_PASS.monthly, yearly: CLINIC_PASS.yearly, livePosts: CLINIC_PASS.livePosts, lookupKey: "clinic_pass_monthly", yearlyLookupKey: "clinic_pass_yearly", covers: ["support", "opticians"], blurb: "Up to 5 live posts at a time for assistants, technicians, reception, patient care, opticians and practice leads, with a featured clinic profile." },
  { key: "clinic_pass_plus", name: "Clinic pass Plus", monthly: CLINIC_PASS_PLUS.monthly, yearly: CLINIC_PASS_PLUS.yearly, livePosts: CLINIC_PASS_PLUS.livePosts, lookupKey: "clinic_pass_plus_monthly", yearlyLookupKey: "clinic_pass_plus_yearly", covers: ["support", "opticians", "optometrists"], blurb: "Up to 5 live posts at a time for every role, optometrists included, with a featured clinic profile." },
];

export const planByKey = (key: string | null | undefined) => PASS_PLANS.find((p) => p.key === key) ?? null;

export const coversRole = (plan: PassPlan, role: string | null | undefined) => plan.covers.includes(bandForRole(role));

export type PassDecision =
  | { kind: "covered" }
  | { kind: "role-not-covered" } // for example an optometrist job on the Clinic pass
  | { kind: "full" }; // the 5 live posts are in use

// Is this job covered? `slotsUsed` is how many jobs the pass already covers that are in review or live.
export function passDecision(plan: PassPlan, role: string | null | undefined, slotsUsed: number): PassDecision {
  if (!coversRole(plan, role)) return { kind: "role-not-covered" };
  if (slotsUsed >= plan.livePosts) return { kind: "full" };
  return { kind: "covered" };
}

// Only an active pass covers anything. One that is overdue, cancelled or never finished does not.
export const passCounts = (status: string | null | undefined) => status === "active";

// Plans are offered once prices are on: a live Stripe key, or a trial (FORCE_PAID_CHECKOUT) on the demo with a test key. During the free launch
// founding clinics can take a pass, so the free launch does not hide them.
export const passesOn = (args: { keyMode: "test" | "live" | null; force: boolean }) => args.keyMode === "live" || (args.keyMode !== null && args.force);

// The words on a clinic's dashboard and Billing page about its pass.
export function passStatusLabel(status: string, cancelAtPeriodEnd: boolean): string {
  if (status === "active") return cancelAtPeriodEnd ? "Active until the end of the paid month, then it stops" : "Active, renews each month";
  if (status === "past_due") return "Payment overdue, so it covers nothing until the card is fixed";
  if (status === "canceled") return "Cancelled";
  return "Not finished";
}

// What the confirm page says when a pass cannot cover a job, and whether switching to Plus would fix it (only for a role the Clinic pass leaves out:
// both passes hold 5 live posts, so Plus does not add room).
export function passChoices(decision: Exclude<PassDecision, { kind: "covered" }>, plan: PassPlan, role: string | null | undefined): { headline: string; detail: string; canUpgrade: boolean } {
  if (decision.kind === "role-not-covered") {
    const plus = planByKey("clinic_pass_plus")!;
    const canUpgrade = plan.key === "clinic_pass" && coversRole(plus, role);
    return {
      headline: `Your ${plan.name} does not cover ${role === "Optometrist" ? "optometrist jobs" : "this kind of job"}`,
      detail: canUpgrade ? `${plus.name} covers every role, optometrists included. You can switch now, or pay the single post price for this job only.` : "You can pay the single post price for this job only.",
      canUpgrade,
    };
  }
  return {
    headline: `All ${plan.livePosts} live posts on your ${plan.name} are in use`,
    detail: `A post is freed when a job is closed or has run its 30 days. Both passes hold ${plan.livePosts} live posts at a time, so switching would not add room. You can wait for a post to free up, or pay the single post price for this job only.`,
    canUpgrade: false,
  };
}

// The line under the name in the account menu for a clinic: its account type, and its plan once passes are offered.
export function planLineText(args: { passesOn: boolean; planName: string | null }): string {
  if (!args.passesOn) return "Clinic account";
  return `Clinic account · ${args.planName ?? "Single posts"}`;
}
