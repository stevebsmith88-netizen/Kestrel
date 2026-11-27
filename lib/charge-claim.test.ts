// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CLAIM_MINUTES, chargeStamp, claimCharge, claimMarker, isClaimMarker, releaseCharge, staleBefore } from "./charge-claim.ts";

// Audit P2-03. A stand in for the payments table that applies the same filters the real update sends: eq, and the 1 "or" the claim uses.
type Row = { id: string; status: string; failure_message: string | null; updated_at: string };

function standIn(row: Row) {
  const table = { row, updates: 0 };
  const db = {
    from: () => ({
      update(values: Partial<Row>) {
        const checks: ((r: Row) => boolean)[] = [];
        const q = {
          eq(column: keyof Row, value: string) { checks.push((r) => r[column] === value); return q; },
          or(filter: string) {
            const [nullPart, ltPart] = filter.split(",");
            assert.equal(nullPart, "failure_message.is.null");
            const before = ltPart.replace("updated_at.lt.", "");
            checks.push((r) => r.failure_message === null || r.updated_at < before);
            return q;
          },
          select() { return q.run(); },
          then(resolve: (v: unknown) => void) { resolve(q.run()); },
          run() {
            if (checks.every((c) => c(table.row))) {
              table.row = { ...table.row, ...values };
              table.updates += 1;
              return { data: [{ id: table.row.id }], error: null };
            }
            return { data: [], error: null };
          },
        };
        return q;
      },
    }),
  };
  return { db: db as unknown as SupabaseClient, table };
}

const saved = (over: Partial<Row> = {}): Row => ({ id: "pay-1", status: "card_saved", failure_message: null, updated_at: "2026-11-27T15:00:00.000Z", ...over });

test("the first approval takes the claim and a second one at the same moment is refused", async () => {
  const { db, table } = standIn(saved());
  const now = new Date("2026-11-27T15:01:00.000Z");
  const first = await claimCharge(db, "pay-1", now);
  const second = await claimCharge(db, "pay-1", new Date(now.getTime() + 1000));
  assert.ok(first && isClaimMarker(first));
  assert.equal(second, null);
  assert.equal(table.row.failure_message, first);
});

test("a claim left behind for longer than the limit can be taken over, so a job is never stuck", async () => {
  const { db } = standIn(saved({ failure_message: claimMarker(new Date("2026-11-27T15:00:00.000Z")) }));
  const later = new Date(Date.parse("2026-11-27T15:00:00.000Z") + (CLAIM_MINUTES * 60 + 1) * 1000);
  assert.ok(await claimCharge(db, "pay-1", later));
  const { db: fresh } = standIn(saved({ failure_message: claimMarker(new Date("2026-11-27T15:00:00.000Z")) }));
  assert.equal(await claimCharge(fresh, "pay-1", new Date(Date.parse("2026-11-27T15:00:00.000Z") + 60_000)), null);
});

test("only a saved card can be claimed", async () => {
  for (const status of ["charged", "failed", "cancelled", "covered_by_pass", "awaiting_card"]) {
    const { db } = standIn(saved({ status }));
    assert.equal(await claimCharge(db, "pay-1", new Date("2026-11-27T15:01:00.000Z")), null, status);
  }
});

test("letting the claim go clears only this attempt's own mark", async () => {
  const { db, table } = standIn(saved());
  const marker = (await claimCharge(db, "pay-1", new Date("2026-11-27T15:01:00.000Z")))!;
  await releaseCharge(db, "pay-1", claimMarker(new Date("2026-11-27T15:02:00.000Z")));
  assert.equal(table.row.failure_message, marker);
  await releaseCharge(db, "pay-1", marker);
  assert.equal(table.row.failure_message, null);
  assert.ok(await claimCharge(db, "pay-1", new Date("2026-11-27T15:03:00.000Z")));
});

test("the Stripe key belongs to the attempt, not to a 10 minute window", () => {
  const a = claimMarker(new Date("2026-11-27T15:09:59.000Z"));
  const b = claimMarker(new Date("2026-11-27T15:10:01.000Z"));
  assert.equal(chargeStamp("pay-1", 7900, a), chargeStamp("pay-1", 7900, a));
  assert.notEqual(chargeStamp("pay-1", 7900, a), chargeStamp("pay-1", 7900, b));
  assert.equal(staleBefore(new Date("2026-11-27T15:10:00.000Z")), "2026-11-27T15:05:00.000Z");
});

test("the charge claims the payment before any money moves, and lets it go after a problem on our side", () => {
  const source = readFileSync("lib/job-payment-flow.ts", "utf8");
  const charge = source.slice(source.indexOf("export async function chargeForJob"), source.indexOf("export async function cancelPaymentForJob"));
  assert.ok(charge.indexOf("claimCharge(db, ready.id)") > 0, "chargeForJob must claim the payment");
  assert.ok(charge.indexOf("claimCharge(db, ready.id)") < charge.indexOf('stripePost<StripeInvoice>("/invoices"'), "the claim must come before the first Stripe request");
  assert.doesNotMatch(charge, /600_000/, "the idempotency key must not use a time window");
  assert.match(charge, /releaseCharge\(db, ready\.id, marker\)/);
  assert.match(charge, /\.eq\("id", covered\.id\)\.eq\("status", "covered_by_pass"\)/);
});
