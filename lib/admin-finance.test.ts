// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { moneyText, summariseFinance } from "./admin-finance.ts";

const from = new Date("2026-11-01T00:00:00Z");
const to = new Date("2026-12-01T00:00:00Z");

test("only charged posts in the period count as revenue", () => {
  const s = summariseFinance(
    [
      { status: "charged", amount_cents: 9900, created_at: "2026-11-10T12:00:00Z" },
      { status: "charged", amount_cents: 5900, created_at: "2026-11-20T12:00:00Z" },
      { status: "charged", amount_cents: 7900, created_at: "2026-10-20T12:00:00Z" },
      { status: "free_launch", amount_cents: 0, created_at: "2026-11-11T12:00:00Z" },
      { status: "covered_by_pass", amount_cents: 0, created_at: "2026-11-12T12:00:00Z" },
      { status: "card_saved", amount_cents: 0, created_at: "2026-11-13T12:00:00Z" },
      { status: "failed", amount_cents: 0, created_at: "2026-11-14T12:00:00Z" },
    ],
    from,
    to,
  );
  assert.equal(s.chargedCents, 15800);
  assert.equal(s.chargedCount, 2);
  assert.equal(s.freeOrPass, 2);
  assert.equal(s.waitingToCharge, 1);
  assert.equal(s.refused, 1);
  assert.equal(s.any, true);
});

test("with no charged posts yet, nothing is revenue", () => {
  const s = summariseFinance([{ status: "free_launch", amount_cents: 0, created_at: "2026-11-11T12:00:00Z" }], from, to);
  assert.equal(s.any, false);
  assert.equal(s.chargedCents, 0);
  assert.deepEqual(summariseFinance([], from, to).any, false);
});

test("money reads as dollars, with cents only when there are some", () => {
  assert.equal(moneyText(9900), "$99");
  assert.equal(moneyText(15825), "$158.25");
  assert.equal(moneyText(0), "$0");
});
