// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { needsTerms } from "./terms-check.ts";

// P1-03 (c): a signed in person with no record of agreeing to the terms is asked to agree at their next sign in, as a Google sign up is.

test("a candidate or clinic with no terms record must agree first", () => {
  assert.equal(needsTerms({ role: "candidate", terms_version: null }), true);
  assert.equal(needsTerms({ role: "clinic" }), true);
});

test("someone who has agreed, an admin, or a database that cannot say is left alone", () => {
  assert.equal(needsTerms({ role: "candidate", terms_version: "2026-10-30 draft" }), false);
  assert.equal(needsTerms({ role: "admin", terms_version: null }), false);
  assert.equal(needsTerms(null), false);
});

test("protected pages send them to agree, after the account type question", () => {
  const auth = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");
  const body = auth.slice(auth.indexOf("export async function requireRole("));
  const type = body.indexOf('redirect("/welcome")');
  const terms = body.indexOf('redirect("/welcome/terms")');
  assert.ok(type > 0 && terms > type);
});

test("agreeing saves the terms version once, and only for the person signed in", () => {
  const actions = readFileSync(new URL("./auth-actions.ts", import.meta.url), "utf8");
  const body = actions.slice(actions.indexOf("export async function agreeToTerms("));
  assert.match(body, /terms_version: TERMS_VERSION/);
  assert.match(body, /\.eq\("id", session\.userId\)\.is\("terms_version", null\)/);
  assert.match(body, /if \(!agree\)/);
});
