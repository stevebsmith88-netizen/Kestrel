// Kestrel's prices, in one place, so the website and the emails always agree. Canadian dollars, before HST.
// Decided 5th November 2026 (see CLAUDE.md). Changing a number here changes it everywhere it is shown,
// but not in Stripe, which has its own prices.

export const POST_DAYS = 30;

export const ROLE_BANDS = [
  { key: "support", label: "Support and patient care", covers: "Optometric assistants, technicians, reception and patient care", price: 59 },
  { key: "opticians", label: "Opticians and practice leads", covers: "Opticians, contact lens fitters and practice managers", price: 79 },
  { key: "optometrists", label: "Optometrists", covers: "Associate and full time optometrists", price: 99 },
] as const;

// Two passes (decided 5th November 2026). The Clinic pass covers support, patient care, optician and practice lead roles.
// Clinic pass Plus also covers optometrists, so a clinic hiring several optometrists is not buying them at the pass discount of 60%.
// The yearly option (10 months for the price of 12) is a founding offer on both passes.
export const CLINIC_PASS = { monthly: 199, livePosts: 5, yearly: 1990, lockMonths: 12 } as const;
export const CLINIC_PASS_PLUS = { monthly: 349, livePosts: 5, yearly: 3490, lockMonths: 12 } as const;

// Founding clinics (Steve, 14th November 2026; the full rule is in docs/pass-procedures.md). The first 50 clinic locations to post during the
// free launch are Founding clinics. A founding clinic that takes a pass during the founding period keeps that pass price for 12 months, or
// until it cancels, whichever comes first. Then the price in force at that time applies, after 30 days notice. Stripe checkout must follow this.
export const FOUNDING_CLINICS = { places: 50, lockMonths: 12, noticeDays: 30 } as const;

// The free launch coupon (Steve, 14th November 2026: "July 2027, I think"). Stripe cannot change a coupon's end date once it exists, so the
// end date lives here and checkout only applies the coupon on or before it. Change the date here, nothing in Stripe needs remaking.
export const FREE_LAUNCH_ENDS = "2027-07-31";

const money = (n: number, places = 0) => "$" + n.toLocaleString("en-CA", { minimumFractionDigits: places, maximumFractionDigits: places });

export const perDay = (price: number) => money(price / POST_DAYS, 2);
export const perPassPost = (pass: { monthly: number; livePosts: number } = CLINIC_PASS) => money(pass.monthly / pass.livePosts, 2);
export const dollars = (n: number) => money(n);

// How many posts at one price it takes before the pass costs less than buying them one at a time.
// Used for the "our pick" line on the clinics page, so the line stays true if a price changes.
export const passBreakEven = (postPrice: number, pass: { monthly: number } = CLINIC_PASS) => Math.floor(pass.monthly / postPrice) + 1;
