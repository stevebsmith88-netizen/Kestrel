// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { IN_TALKS, readStillTalking, stillTalkingMessage } from "./still-talking.ts";

// P1-13: when a clinic marks a role filled, the people at Interview or Offer are listed with a kind message each, and closed as Role
// filled unless the clinic ticks "Don't close this one yet". Before, they were never told and stayed at Interview for ever.
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

const form = (entries: [string, string][]) => {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
};

test("only people at Interview or Offer are in the list", () => {
  assert.deepEqual([...IN_TALKS], ["interview", "offer"]);
});

test("the ready made message is the agreed wording, with the clinic's name", () => {
  assert.equal(
    stillTalkingMessage("Brightview Optometry"),
    "Thank you for the time you gave us during the interview process at Brightview Optometry. We have now filled this role with another candidate. We were glad to meet you and wish you well.",
  );
  assert.doesNotMatch(stillTalkingMessage("X"), /[—–]|\[/);
});

test("each person gets the clinic's message, or the ready made one if it was left empty or has square brackets", () => {
  const plan = readStillTalking(form([["talkingIds", A], [`talkMsg_${A}`, "  We loved meeting you, Ann.  "], ["talkingIds", B], [`talkMsg_${B}`, ""], ["talkingIds", C], [`talkMsg_${C}`, "See you [date]"]]), "Brightview", null);
  assert.deepEqual(plan.map((p) => p.message), ["We loved meeting you, Ann.", stillTalkingMessage("Brightview"), stillTalkingMessage("Brightview")]);
});

test("anyone ticked Don't close this one yet is left open, and so is the person named as hired", () => {
  const plan = readStillTalking(form([["talkingIds", A], ["talkingIds", B], [`keepOpen_${B}`, "yes"], ["talkingIds", C]]), "Brightview", C);
  assert.deepEqual(plan.map((p) => p.id), [A]);
});

test("ids that are not real ids, repeats and very long messages are dealt with", () => {
  const plan = readStillTalking(form([["talkingIds", "nonsense"], ["talkingIds", A], ["talkingIds", A], [`talkMsg_${A}`, "x".repeat(3000)]]), "Brightview", null);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].message.length, 1500);
});

test("fillRole tells the people in talks before closing everyone still waiting", () => {
  const source = readFileSync(new URL("./applicant-actions.ts", import.meta.url), "utf8");
  const body = source.slice(source.indexOf("export async function fillRole("));
  const talks = body.indexOf("await closeInTalks(");
  const waiting = body.indexOf('await closeWaiting(jobId, null, "role_filled")');
  assert.ok(talks > 0 && waiting > talks);
});

test("both role filled forms show the new section", () => {
  for (const page of ["applicants", "ending"]) {
    const source = readFileSync(new URL(`../app/clinic/jobs/[id]/${page}/page.tsx`, import.meta.url), "utf8");
    assert.match(source, /talking=\{/, page);
  }
});
