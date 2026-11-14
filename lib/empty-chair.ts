// What an empty optician chair can cost a clinic each month (the calculator on /clinics and the blog post "What an empty optician
// chair costs"). 2 parts, both shown with their sum written out, nothing hidden:
//   glasses sales that walk out: exams a month x share needing new glasses x share of those sales lost while short x average sale
//   exam time lost: hours a week the optometrist spends dispensing x exams an hour x exam fee x weeks in a month
// The defaults are an example, labelled as one on the page (Steve, 14th November 2026; sources in docs/blog-drafts/why-pay-for-a-job-ad.md):
//   230 exams a month (about 9 full exams a day, Steve; the University of Waterloo's careers page gives about 2,800 a year),
//   41% needing a glasses prescription change (University of Waterloo, Optometry and Vision Science, 2016, 2,656 patients with no symptoms),
//   10% of those sales lost while short (an assumption the owner changes), $500 average sale (Steve's example; the Canadian Journal of
//   Ophthalmology, as cited by a clinic, gives $240 to almost $1,000), 2 exams an hour (Steve), $200 exam fee (the low end of the CAO's
//   $200 to $250 for a comprehensive exam with imaging). Nothing typed is saved or sent anywhere.

export const WEEKS_IN_A_MONTH = 52 / 12;

export type ChairInputs = {
  examsPerMonth: number;
  needGlassesPercent: number;
  lostSalesPercent: number;
  averageSale: number;
  dispensingHoursPerWeek: number;
  examsPerHour: number;
  examFee: number;
};

export const CHAIR_DEFAULTS: ChairInputs = {
  examsPerMonth: 230,
  needGlassesPercent: 41,
  lostSalesPercent: 10,
  averageSale: 500,
  dispensingHoursPerWeek: 5,
  examsPerHour: 2,
  examFee: 200,
};

// A typed value that is empty, negative or not a number counts as 0, and a share is held between 0 and 100.
const n = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
const pct = (v: number) => Math.min(100, n(v)) / 100;

export function emptyChairCost(i: ChairInputs) {
  const lostSales = n(i.examsPerMonth) * pct(i.needGlassesPercent) * pct(i.lostSalesPercent);
  const glasses = lostSales * n(i.averageSale);
  const examsLost = n(i.dispensingHoursPerWeek) * n(i.examsPerHour) * WEEKS_IN_A_MONTH;
  const examTime = examsLost * n(i.examFee);
  return { lostSales, glasses, examsLost, examTime, total: glasses + examTime };
}

// "$4,700": rounded to the nearest $100, because the inputs are estimates.
export const roughDollars = (v: number) => `$${(Math.round(v / 100) * 100).toLocaleString("en-CA")}`;
