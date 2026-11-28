// The claim on a saved card before it is charged (audit P2-03, 27th November 2026). 2 approvals at almost the same moment (Slack and the
// review queue, or a double click) must never charge the card twice. Before any money moves, the approval marks the payment row as being
// charged, in 1 update that only works if nobody else holds the mark. The other approval finds the mark and stops. The mark is kept in
// failure_message, which is shown only on a refused payment, so no SQL is needed. A mark older than CLAIM_MINUTES (the server stopped half
// way) no longer counts, so a job can never be stuck.
import type { SupabaseClient } from "@supabase/supabase-js";

export const CLAIM_PREFIX = "charging:";
export const CLAIM_MINUTES = 5;

export const claimMarker = (now: Date) => `${CLAIM_PREFIX}${now.getTime()}`;
export const isClaimMarker = (text: string | null | undefined) => Boolean(text && text.startsWith(CLAIM_PREFIX));

// A mark set before this time is stale and may be taken over.
export const staleBefore = (now: Date) => new Date(now.getTime() - CLAIM_MINUTES * 60_000).toISOString();

// The Stripe idempotency key for 1 charging attempt. It belongs to the claim, so a repeat of the same request inside 1 attempt does its work
// once, and a later attempt (after a problem on our side) starts fresh. It never depends on the clock, which is what let 2 approvals either
// side of a 10 minute mark make 2 invoices.
export const chargeStamp = (paymentId: string, cents: number, marker: string) => `${paymentId}-${cents}-${marker.slice(CLAIM_PREFIX.length)}`;

export const BUSY_MESSAGE = "This job is already being approved and charged. Refresh in a moment to see the result.";

// Takes the claim. Returns the marker when this approval may charge, or null when another one holds a fresh claim (or the card is no longer
// saved). Only a row still at card_saved can be claimed, and only when it holds no mark or a stale one.
export async function claimCharge(db: SupabaseClient, paymentId: string, now: Date = new Date()): Promise<string | null> {
  const marker = claimMarker(now);
  const { data, error } = await db
    .from("job_payments")
    .update({ failure_message: marker, updated_at: now.toISOString() })
    .eq("id", paymentId)
    .eq("status", "card_saved")
    .or(`failure_message.is.null,updated_at.lt.${staleBefore(now)}`)
    .select("id");
  if (error) {
    console.error("Charge claim failed:", error.code, error.message);
    return null;
  }
  return data?.length ? marker : null;
}

// Lets the claim go after a problem on our side, so approving again tries again straight away. Only this attempt's own mark is cleared.
export async function releaseCharge(db: SupabaseClient, paymentId: string, marker: string): Promise<void> {
  await db.from("job_payments").update({ failure_message: null, updated_at: new Date().toISOString() }).eq("id", paymentId).eq("status", "card_saved").eq("failure_message", marker);
}
