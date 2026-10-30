// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { emailMatchesWebsite, hashToken, newToken, tokenMatches, validateClaim } from "./claims.ts";

test("an address at the clinic's own website counts", () => {
  assert.equal(emailMatchesWebsite("jamie@harbourside.ca", "https://www.harbourside.ca/careers"), true);
  assert.equal(emailMatchesWebsite("Jamie@Harbourside.CA", "https://harbourside.ca"), true);
  assert.equal(emailMatchesWebsite("jamie@mail.harbourside.ca", "https://harbourside.ca"), true);
  assert.equal(emailMatchesWebsite("jamie@harbourside.ca", "https://careers.harbourside.ca/jobs"), true);
});

test("free email, other domains and shared website builders never count", () => {
  assert.equal(emailMatchesWebsite("jamie@gmail.com", "https://harbourside.ca"), false);
  assert.equal(emailMatchesWebsite("jamie@harbourside.com", "https://harbourside.ca"), false);
  assert.equal(emailMatchesWebsite("jamie@evilharbourside.ca", "https://harbourside.ca"), false);
  assert.equal(emailMatchesWebsite("jamie@wixsite.com", "https://harbourside.wixsite.com/site"), false);
  assert.equal(emailMatchesWebsite("jamie@gmail.com", "https://gmail.com"), false);
  assert.equal(emailMatchesWebsite("jamie@harbourside.ca", null), false);
  assert.equal(emailMatchesWebsite("jamie@harbourside.ca", "not a web address"), false);
});

test("a claim needs an email, a role and a confirmation, and a note when checked by a person", () => {
  const ok = { workEmail: "jamie@harbourside.ca", role: "Owner", authorised: true, manual: false, note: "" };
  assert.deepEqual(validateClaim(ok), {});
  assert.ok(validateClaim({ ...ok, workEmail: "nope" }).workEmail);
  assert.ok(validateClaim({ ...ok, role: "King" }).role);
  assert.ok(validateClaim({ ...ok, authorised: false }).authorised);
  assert.ok(validateClaim({ ...ok, manual: true, note: "short" }).note);
  assert.deepEqual(validateClaim({ ...ok, manual: true, note: "I am the owner and my name is on the college register." }), {});
});

test("verification tokens only match the token they were made from", () => {
  const token = newToken();
  const hash = hashToken(token);
  assert.equal(tokenMatches(hash, token), true);
  assert.equal(tokenMatches(hash, newToken()), false);
  assert.equal(tokenMatches(null, token), false);
  assert.equal(tokenMatches(hash, ""), false);
  assert.notEqual(hash, token);
});
