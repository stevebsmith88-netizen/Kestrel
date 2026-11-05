// Kestrel's prices, in one place, so the website and the emails always agree. Canadian dollars, before HST.
// Decided 5th November 2026 (see CLAUDE.md). Changing a number here changes it everywhere it is shown,
// but not in Stripe, which has its own prices.

export const POST_DAYS = 30;

export const ROLE_BANDS = [
  { key: "support", label: "Support and patient care", covers: "Optometric assistants, technicians, reception and patient care", price: 59 },
  { key: "opticians", label: "Opticians and practice leads", covers: "Opticians, contact lens fitters and practice managers", price: 79 },
  { key: "optometrists", label: "Optometrists", covers: "Associate and full time optometrists", price: 99 },
] as const;

export const CLINIC_PASS = { monthly: 199, livePosts: 5, yearly: 1990, lockMonths: 12 } as const;

const money = (n: number, places = 0) => "$" + n.toLocaleString("en-CA", { minimumFractionDigits: places, maximumFractionDigits: places });

export const perDay = (price: number) => money(price / POST_DAYS, 2);
export const perPassPost = () => money(CLINIC_PASS.monthly / CLINIC_PASS.livePosts, 2);
export const dollars = (n: number) => money(n);
