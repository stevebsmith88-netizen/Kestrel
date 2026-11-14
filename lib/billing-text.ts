// The words on a clinic's Billing page and the total it shows. Pure, so it can be tested (lib/billing-text.test.ts).

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  charged: "Paid",
  card_saved: "Card saved, not charged yet",
  awaiting_card: "Card not saved yet",
  failed: "Card refused",
  free_launch: "Free launch, nothing to pay",
};

export const paymentStatusLabel = (status: string) => PAYMENT_STATUS_LABEL[status] ?? status;

// What has been paid in total, before HST, in cents. Only charged payments count.
export const totalPaidCents = (rows: { status: string; amount_cents: number }[]) => rows.filter((r) => r.status === "charged").reduce((sum, r) => sum + r.amount_cents, 0);
