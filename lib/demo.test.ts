// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { DEMO_BANNER, demoMode } from "./demo.ts";

test("demo mode is on only when DEMO_MODE is exactly yes", () => {
  assert.equal(demoMode({ DEMO_MODE: "yes" }), true);
  for (const value of [undefined, "", "no", "true", "YES", "1"]) assert.equal(demoMode({ DEMO_MODE: value }), false, String(value));
});

test("the banner warns about real information and email, in the house style", () => {
  assert.match(DEMO_BANNER, /sample/);
  assert.match(DEMO_BANNER, /real personal information/);
  assert.match(DEMO_BANNER, /no email is sent/);
  assert.ok(!/[\u2013\u2014]/.test(DEMO_BANNER));
});
