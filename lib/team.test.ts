// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { appendNote, canEdit, cleanInviteCode, codeHash, inviteExpiry, inviteProblem, levelLabel, newInviteCode, TEAM_MAX } from "./team.ts";

test("invite codes are easy to read and hard to guess", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const code = newInviteCode();
    assert.match(code, /^KT-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    seen.add(code);
  }
  assert.ok(seen.size > 195);
});

test("a code typed loosely is tidied, and anything else is refused", () => {
  assert.equal(cleanInviteCode(" kt-7q4k-m2xp "), "KT-7Q4K-M2XP");
  assert.equal(cleanInviteCode("7Q4K M2XP"), "KT-7Q4K-M2XP");
  assert.equal(cleanInviteCode("KT-7Q4K-M2X0"), ""); // 0 is never used
  assert.equal(cleanInviteCode("launch2027"), "");
  assert.equal(codeHash("kt 7q4k m2xp"), codeHash("KT-7Q4K-M2XP"));
  assert.equal(codeHash("KT-7Q4K-M2XP").length, 64);
});

test("an invitation works once, for its own address, until it runs out", () => {
  const now = new Date("2026-11-20T12:00:00Z");
  const ok = { email: "sam@clinic.ca", expires_at: inviteExpiry(new Date("2026-11-14T12:00:00Z")).toISOString(), accepted_at: null, cancelled_at: null };
  assert.equal(inviteProblem(ok, "Sam@Clinic.ca", now), null);
  assert.match(inviteProblem(ok, "other@clinic.ca", now) ?? "", /different email/);
  assert.match(inviteProblem({ ...ok, accepted_at: now.toISOString() }, "sam@clinic.ca", now) ?? "", /already been used/);
  assert.match(inviteProblem({ ...ok, cancelled_at: now.toISOString() }, "sam@clinic.ca", now) ?? "", /cancelled/);
  assert.match(inviteProblem(ok, "sam@clinic.ca", new Date("2026-11-29T12:00:00Z")) ?? "", /run out/);
  assert.match(inviteProblem(null, "sam@clinic.ca", now) ?? "", /not right/);
});

test("levels", () => {
  assert.equal(canEdit("owner"), true);
  assert.equal(canEdit("edit"), true);
  assert.equal(canEdit("view"), false);
  assert.equal(canEdit(null), false);
  assert.equal(levelLabel("view"), "View only, with notes");
  assert.equal(TEAM_MAX, 5);
});

test("a view only note is added, never replacing what is there", () => {
  const when = new Date("2026-11-14T15:00:00Z");
  assert.equal(appendNote("", "Vic", "Strong on contacts", when), "Vic, 14th November 2026: Strong on contacts");
  assert.equal(appendNote("Call Tuesday", "Vic", "Agree", when), "Call Tuesday\n\nVic, 14th November 2026: Agree");
  assert.equal(appendNote("x".repeat(2990), "Vic", "Agree", when).length, 3000);
});
