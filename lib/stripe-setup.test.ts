// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { describeAccount, explainStripeError, publishableKeyMode, secretKeyMode, stripeChecks } from "./stripe-setup.ts";

const find = (checks: ReturnType<typeof stripeChecks>, start: string) => checks.find((c) => c.label.startsWith(start));
const SK = "sk_test_51HIDDENHIDDENHIDDEN";
const PK = "pk_test_51PUBLICPUBLICPUBLIC";

test("key modes are read from the start of each key", () => {
  assert.equal(secretKeyMode(SK), "test");
  assert.equal(secretKeyMode("rk_live_abc123"), "live");
  assert.equal(secretKeyMode("pk_test_abc"), null, "a publishable key is not a secret key");
  assert.equal(publishableKeyMode(PK), "test");
  assert.equal(publishableKeyMode(SK), null);
  assert.equal(secretKeyMode(undefined), null);
});

test("missing keys are named, and good ones are never shown", () => {
  const none = stripeChecks({});
  assert.equal(find(none, "STRIPE_SECRET_KEY")!.ok, false);
  assert.equal(find(none, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")!.ok, false);
  assert.equal(find(none, "The 2 keys match"), undefined);
  const good = stripeChecks({ STRIPE_SECRET_KEY: SK, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: PK });
  assert.ok(good.every((c) => c.ok), JSON.stringify(good));
  assert.ok(!JSON.stringify(good).includes("HIDDEN"), "the secret key never appears");
  assert.match(find(good, "STRIPE_SECRET_KEY")!.detail, /Set, test mode, 28 characters/);
});

test("common slips in pasting are spotted", () => {
  for (const bad of [" sk_test_abc", "sk_test_abc\n", "\"sk_test_abc\"", "pk_test_abc", "abc123"]) {
    assert.equal(find(stripeChecks({ STRIPE_SECRET_KEY: bad }), "STRIPE_SECRET_KEY")!.ok, false, bad);
  }
});

test("a test key beside a live key, or any live key, needs attention", () => {
  const mixed = stripeChecks({ STRIPE_SECRET_KEY: "sk_live_abc", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: PK });
  assert.equal(find(mixed, "The 2 keys match")!.ok, false);
  assert.equal(find(mixed, "Test mode")!.ok, false);
  assert.equal(find(stripeChecks({ STRIPE_SECRET_KEY: SK, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: PK }), "Test mode")!.ok, true);
});

test("the account summary checks the name, statement line, country and tax", () => {
  const lines = describeAccount(
    { country: "CA", default_currency: "cad", details_submitted: false, business_profile: { name: "Kestrel Eye Care Jobs" }, settings: { payments: { statement_descriptor: "KESTREL EYECARE" } } },
    { status: "pending" },
    "test",
  ).join(" ");
  assert.match(lines, /Business name customers see: Kestrel Eye Care Jobs\./);
  assert.match(lines, /KESTREL EYECARE/);
  assert.match(lines, /Country: CA, currency CAD\./);
  assert.match(lines, /Stripe Tax is off/);
  assert.match(lines, /not finished yet/);
  const bare = describeAccount({ country: "US" }, null, "test").join(" ");
  assert.match(bare, /No public business name/);
  assert.match(bare, /should be CA/);
});

test("errors from Stripe become plain next steps without the key", () => {
  assert.match(explainStripeError(401, "Invalid API Key provided: sk_test_****abcd"), /did not accept the secret key/);
  assert.match(explainStripeError(403, "The provided key 'rk_test_abc' does not have the required permissions"), /restricted key/);
  assert.ok(!explainStripeError(500, "oops sk_test_51SECRET").includes("SECRET"));
  assert.match(explainStripeError(null, "fetch failed"), /could not be reached/);
});

test("the webhook secret is optional but must look right when set", () => {
  const without = stripeChecks({ STRIPE_SECRET_KEY: SK, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: PK });
  assert.equal(find(without, "STRIPE_WEBHOOK_SECRET")!.ok, true);
  assert.match(find(without, "STRIPE_WEBHOOK_SECRET")!.detail, /Not set yet/);
  const good = stripeChecks({ STRIPE_WEBHOOK_SECRET: "whsec_abc123DEF" });
  assert.equal(find(good, "STRIPE_WEBHOOK_SECRET")!.ok, true);
  assert.ok(!JSON.stringify(good).includes("abc123DEF"), "the secret never appears");
  for (const bad of [" whsec_abc", "sk_test_abc", "\"whsec_abc\""]) assert.equal(find(stripeChecks({ STRIPE_WEBHOOK_SECRET: bad }), "STRIPE_WEBHOOK_SECRET")!.ok, false, bad);
});
