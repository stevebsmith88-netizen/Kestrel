// Why a charge did not go through, in plain words (Steve, 14th November 2026): not Stripe's technical wording. The full detail is kept only in the
// job's activity log. Pure, so it can be tested (lib/payment-reasons.test.ts).

export type FailureInput = { status: number | null; type: string | null; code: string | null; declineCode: string | null };

export type Reason = {
  label: string;
  // true when the cardholder's bank said no or needs them to act: the clinic is asked for a new card. Otherwise it is a problem for Kestrel.
  cardRefused: boolean;
};

export function plainReason(input: FailureInput): Reason {
  const decline = (input.declineCode ?? "").toLowerCase();
  const code = (input.code ?? "").toLowerCase();
  if (input.type === "card_error") {
    if (decline === "insufficient_funds" || code === "insufficient_funds") return { label: "Insufficient funds", cardRefused: true };
    if (decline === "expired_card" || code === "expired_card") return { label: "Card expired", cardRefused: true };
    if (code === "authentication_required" || decline === "authentication_required") return { label: "Card needs the cardholder to confirm", cardRefused: true };
    return { label: "Card declined", cardRefused: true };
  }
  // Stripe or the network is not answering, or is too busy: not the clinic's doing, and trying again later is the fix.
  if (input.status === null || input.status >= 500 || input.status === 429 || input.type === "api_connection_error" || input.type === "api_error" || input.type === "rate_limit_error") {
    return { label: "Payment system down", cardRefused: false };
  }
  // A mistake in our request or in the Stripe set up.
  return { label: "Set up problem", cardRefused: false };
}
