// The finance numbers on the admin Dashboard (Steve, 14th November 2026), worked out from the job payment rows so they can be tested.
// Amounts are before HST. A post paid by a pass or posted free during the launch is counted separately and adds no revenue.

export type PaymentRow = { status: string; amount_cents: number; created_at: string };
export type FinanceSummary = {
  chargedCents: number; // taken in the period, before HST
  chargedCount: number;
  waitingToCharge: number; // a card is saved and the job is waiting for approval
  refused: number; // a card was refused and not yet fixed
  freeOrPass: number; // free launch or covered by a pass
  any: boolean; // false until the first payment of any kind
};

export function summariseFinance(rows: PaymentRow[], from: Date, to: Date): FinanceSummary {
  const inPeriod = rows.filter((r) => {
    const t = new Date(r.created_at).getTime();
    return t >= from.getTime() && t < to.getTime();
  });
  const charged = inPeriod.filter((r) => r.status === "charged");
  return {
    chargedCents: charged.reduce((sum, r) => sum + (Number(r.amount_cents) || 0), 0),
    chargedCount: charged.length,
    waitingToCharge: rows.filter((r) => r.status === "card_saved").length,
    refused: rows.filter((r) => r.status === "failed").length,
    freeOrPass: inPeriod.filter((r) => r.status === "free_launch" || r.status === "covered_by_pass").length,
    any: rows.some((r) => r.status === "charged"),
  };
}

export const moneyText = (cents: number) => "$" + (cents / 100).toLocaleString("en-CA", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
