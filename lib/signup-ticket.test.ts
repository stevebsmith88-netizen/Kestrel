// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// P1-03: every sign up through the website carries a one time ticket, issued only after the website's own checks. Since migration 0041
// the database refuses an email sign up without one, even once sign up is open. The database side is tested in scripts/dev/rls-tests.sql.
const source = readFileSync(new URL("./auth-actions.ts", import.meta.url), "utf8");
const signUp = source.slice(source.indexOf("export async function signUp("), source.indexOf("export async function forgotPassword("));

test("a ticket is issued for every sign up, not only while the gate is closed", () => {
  assert.match(signUp, /const ticket = await issueSignupTicket\(\);/);
  assert.match(signUp, /signup_ticket: ticket,/);
  assert.doesNotMatch(signUp, /open \? undefined/);
});

test("the ticket is issued only after the terms tick, the invitation code and the bot check", () => {
  const at = (needle: string) => {
    const i = signUp.indexOf(needle);
    assert.ok(i >= 0, needle);
    return i;
  };
  const ticket = at("await issueSignupTicket()");
  for (const check of ["if (!agree)", "clinicInviteOk(invite)", "passesTurnstile("]) assert.ok(at(check) < ticket, `${check} comes first`);
});

test("migration 0041 is in the combined file, with its row in the final check", () => {
  const combined = readFileSync(new URL("../supabase/combined/run-everything.sql", import.meta.url), "utf8");
  assert.match(combined, /-- 0041_signup_ticket_always\.sql/);
  assert.match(combined, /every email sign up needs Kestrel''s ticket/);
});
