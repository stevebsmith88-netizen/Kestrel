// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanName, fullName, validateEmailChange, validateName } from "./account.ts";

test("names are tidied and checked", () => {
  assert.equal(cleanName("  Jamie    Lee  "), "Jamie Lee");
  assert.equal(cleanName(undefined), "");
  assert.equal(cleanName("x".repeat(100)).length, 60);
  assert.deepEqual(validateName("Jamie", ""), {});
  assert.deepEqual(validateName("Mary-Anne", "O'Brien"), {});
  assert.deepEqual(validateName("Zoë", "Müller"), {});
  assert.ok(validateName("", "Lee").firstName);
  assert.ok(validateName("J4mie", "").firstName);
  assert.ok(validateName("Jamie", "<script>").firstName);
  assert.equal(fullName("Jamie", ""), "Jamie");
  assert.equal(fullName("Jamie", "Lee"), "Jamie Lee");
});

test("an email change needs a new, valid address and the password", () => {
  assert.deepEqual(validateEmailChange("a@x.ca", "b@x.ca", "secret"), {});
  assert.ok(validateEmailChange("a@x.ca", "A@X.CA", "secret").email);
  assert.ok(validateEmailChange("a@x.ca", "nope", "secret").email);
  assert.ok(validateEmailChange("a@x.ca", "b@x.ca", "").password);
});
