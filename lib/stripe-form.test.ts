// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { formEncode } from "./stripe.ts";

test("nested values and lists are written the way Stripe reads them", () => {
  const body = formEncode({ product: "p1", unit_amount: 5900, recurring: { interval: "month" }, applies_to: { products: ["a", "b"] }, skipped: undefined, also: null });
  assert.deepEqual(body.map(decodeURIComponent), ["product=p1", "unit_amount=5900", "recurring[interval]=month", "applies_to[products][0]=a", "applies_to[products][1]=b"]);
});

test("values with spaces or symbols are escaped", () => {
  assert.deepEqual(formEncode({ name: "Job post & more" }), ["name=Job%20post%20%26%20more"]);
});
