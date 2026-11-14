// Founding clinics (step 5 of docs/plans/stripe-plan.md; the rule is in docs/pass-procedures.md). Pure, so it can be tested (lib/founding.test.ts).
// The first 50 clinic locations to have a job approved during the free launch are Founding clinics. One that takes a pass while the launch offer is
// open (up to FREE_LAUNCH_ENDS) keeps the price it starts on for 12 months from the pass start, or until it cancels, whichever comes first, and may take
// the yearly option (10 months for the price of 12). Then the price in force applies, after 30 days notice.

import { FOUNDING_CLINICS } from "./pricing.ts";
import { freeLaunchOpen } from "./stripe-catalog.ts";
import { emailLayout } from "./email-layout.ts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://eyecarejobs.ca";

// The founding offer is open while the free launch is. After the free launch ends, no clinic can start a founding pass.
export const foundingOfferOpen = (now: Date = new Date(), endsOn?: string) => (endsOn ? freeLaunchOpen(now, endsOn) : freeLaunchOpen(now));

// The date the price lock ends: 12 months after the pass starts, on the same day of the month, or the last day of a shorter month.
export function lockEnds(start: Date, months: number = FOUNDING_CLINICS.lockMonths): Date {
  const end = new Date(start.getTime());
  const day = end.getUTCDate();
  end.setUTCDate(1);
  end.setUTCMonth(end.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate();
  end.setUTCDate(Math.min(day, lastDay));
  return end;
}

// Is the lock about to end, so the 30 days notice email is due? True from 30 days before the end up to the end itself.
export function reminderDue(lockEnd: Date, now: Date = new Date(), noticeDays: number = FOUNDING_CLINICS.noticeDays): boolean {
  const ms = noticeDays * 24 * 60 * 60 * 1000;
  return now.getTime() >= lockEnd.getTime() - ms && now.getTime() < lockEnd.getTime();
}

// The yearly option: 10 months for the price of 12, offered to a Founding clinic while the offer is open.
export const yearlyOffered = (args: { founding: boolean; offerOpen: boolean }) => args.founding && args.offerOpen;

export function yearlySaving(monthly: number, yearly: number): { twelveMonths: number; saved: number } {
  const twelveMonths = monthly * 12;
  return { twelveMonths, saved: twelveMonths - yearly };
}

export const placesLeft = (taken: number) => Math.max(0, FOUNDING_CLINICS.places - taken);

const dollars = (n: number) => "$" + n.toLocaleString("en-CA");
const dateLabel = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "long", day: "numeric" });

// Email 1: a location becomes a Founding clinic.
export function foundingWelcomeEmail({ clinicName, number }: { clinicName: string; number: number }) {
  return {
    subject: "You are 1 of the first 50 clinics on Kestrel",
    ...emailLayout({
      heading: "You are 1 of our first 50 clinics",
      paragraphs: [
        `Thank you for being one of the first clinics on Kestrel Eye Care Jobs. ${clinicName} is Founding clinic number ${number} of ${FOUNDING_CLINICS.places}.`,
        `Founding clinics get a Founding clinic mark on their public clinic page. If you take a pass while the launch offer is open, the price you start on is kept for ${FOUNDING_CLINICS.lockMonths} months, or until you cancel, whichever comes first, and you can choose the yearly option, which is 10 months for the price of 12.`,
        "You do not need to do anything now. Plans is on your dashboard whenever you are ready.",
        "The Kestrel team",
      ],
      buttonText: "See plans",
      buttonUrl: `${SITE}/clinic/plans`,
    }),
  };
}

// Email 2: thank you for taking a pass, with the lock date.
export function foundingThanksEmail({ planName, interval, priceDollars, lockedUntil }: { planName: string; interval: "month" | "year"; priceDollars: number; lockedUntil: Date | null }) {
  const price = interval === "year" ? `${dollars(priceDollars)} a year` : `${dollars(priceDollars)} a month`;
  return {
    subject: `Thank you for starting the ${planName}`,
    ...emailLayout({
      heading: "Thank you for starting your pass",
      paragraphs: [
        `Your ${planName} is on. As a Founding clinic your price is ${price} plus HST.`,
        interval === "year" || !lockedUntil
          ? "Your yearly price stays the same each year for as long as the pass renews."
          : `That price is locked until ${dateLabel(lockedUntil)}. After that date the price in force at that time applies, and we will email you at least ${FOUNDING_CLINICS.noticeDays} days before it changes.`,
        "You can see your pass, change the card or cancel any time under Plans.",
        "The Kestrel team",
      ],
      buttonText: "Open Plans",
      buttonUrl: `${SITE}/clinic/plans`,
    }),
  };
}

// Email 3: 30 days before the lock ends. This is also the notice of the new price.
export function foundingReminderEmail({ planName, lockEnd, newPriceDollars }: { planName: string; lockEnd: Date; newPriceDollars: number }) {
  return {
    subject: `Your founding price on the ${planName} ends on ${dateLabel(lockEnd)}`,
    ...emailLayout({
      heading: "Your founding price is about to end",
      paragraphs: [
        `Your founding price on the ${planName} is locked until ${dateLabel(lockEnd)}.`,
        `From that date the price in force applies: ${dollars(newPriceDollars)} a month plus HST. This email is your ${FOUNDING_CLINICS.noticeDays} days notice. Nothing changes before then, and you can cancel any time under Plans.`,
        "Thank you again for being one of our first clinics.",
        "The Kestrel team",
      ],
      buttonText: "Open Plans",
      buttonUrl: `${SITE}/clinic/plans`,
    }),
  };
}
