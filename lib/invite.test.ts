// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { clinicInviteOk, clinicInviteOnly } from "./invite.ts";

test("clinic sign up is by invitation unless CLINIC_SIGNUP is yes", () => {
  assert.equal(clinicInviteOnly({}), true);
  assert.equal(clinicInviteOnly({ CLINIC_SIGNUP: "no" }), true);
  assert.equal(clinicInviteOnly({ CLINIC_SIGNUP: "yes" }), false);
});

test("the right code works, in any case and with stray spaces", () => {
  const env = { CLINIC_INVITE_CODE: "Hawk-2027" };
  assert.equal(clinicInviteOk("hawk-2027", env), true);
  assert.equal(clinicInviteOk("  HAWK-2027 ", env), true);
  assert.equal(clinicInviteOk("hawk-2028", env), false);
  assert.equal(clinicInviteOk("", env), false);
});

test("with the switch on and no code set, nobody gets in", () => {
  assert.equal(clinicInviteOk("", {}), false);
  assert.equal(clinicInviteOk("anything", {}), false);
  assert.equal(clinicInviteOk("short", { CLINIC_INVITE_CODE: "short" }), false);
});

test("once the switch is open, no code is needed", () => {
  assert.equal(clinicInviteOk("", { CLINIC_SIGNUP: "yes" }), true);
});
