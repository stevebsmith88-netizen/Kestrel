// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { runSlackAction, type SlackDeps } from "./slack-actions-core.ts";
import type { SlackAction } from "./slack-approvals.ts";

const ID = "5b1ad8a2-1f0c-4a0e-9d5e-3c1c8d6f3a11";
const act = (over: Partial<SlackAction> = {}): SlackAction => ({ kind: "approve_job", id: ID, userId: "U0ABC123", userName: "steve", responseUrl: "https://hooks.slack.com/actions/T0/1/x", ...over });
const calls: string[] = [];
const deps = (over: Partial<SlackDeps> = {}): SlackDeps => ({
  env: { SLACK_APPROVER_IDS: "U0ABC123" },
  jobFlags: async () => [],
  approveJob: async (id, via) => { calls.push(`job ${id} ${via}`); return { key: "approved" }; },
  claimState: async () => ({ method: "email", status: "pending_review" }),
  approveClaim: async (id) => { calls.push(`claim ${id}`); return { ok: true, clinicName: "Riverside Family Eye Care" }; },
  ...over,
});
const when = new Date("2026-11-14T21:12:00Z");

test("an approver can approve a clean waiting job, and the note says it came from Slack", async () => {
  calls.length = 0;
  const out = await runSlackAction(act(), deps(), when);
  assert.equal(out.ok, true);
  assert.match(out.result, /Approved by steve from Slack at 4:12/);
  assert.deepEqual(calls, [`job ${ID} from Slack by steve`]);
});

test("someone who is not an approver does nothing, whatever they press", async () => {
  calls.length = 0;
  const out = await runSlackAction(act({ userId: "U0OTHER99" }), deps(), when);
  assert.equal(out.ok, false);
  assert.match(out.result, /not on the list/);
  assert.equal((await runSlackAction(act({ userId: "U0ABC123" }), deps({ env: {} }), when)).ok, false, "no list set means nobody");
  assert.deepEqual(calls, []);
});

test("a job that is no longer waiting, or now has flags, is not approved", async () => {
  calls.length = 0;
  assert.match((await runSlackAction(act(), deps({ jobFlags: async () => null }), when)).result, /no longer waiting/);
  assert.match((await runSlackAction(act(), deps({ jobFlags: async () => ["Pay is wide"] }), when)).result, /needs a look/);
  assert.deepEqual(calls, []);
});

test("a refused card or a Quebec job is reported and nothing is published", async () => {
  assert.match((await runSlackAction(act(), deps({ approveJob: async () => ({ key: "payment-failed" }) }), when)).result, /card was refused/);
  assert.match((await runSlackAction(act(), deps({ approveJob: async () => ({ key: "quebec" }) }), when)).result, /Quebec/);
  assert.equal((await runSlackAction(act(), deps({ approveJob: async () => ({ key: "error" }) }), when)).ok, false);
});

test("a claim confirmed by email can be approved, any other cannot", async () => {
  calls.length = 0;
  const ok = await runSlackAction(act({ kind: "approve_claim" }), deps(), when);
  assert.equal(ok.ok, true);
  assert.match(ok.result, /Riverside Family Eye Care approved by steve/);
  assert.deepEqual(calls, [`claim ${ID}`]);
  assert.match((await runSlackAction(act({ kind: "approve_claim" }), deps({ claimState: async () => ({ method: "manual", status: "pending_review" }) }), when)).result, /claims page/);
  assert.match((await runSlackAction(act({ kind: "approve_claim" }), deps({ claimState: async () => null }), when)).result, /no longer waiting/);
  assert.match((await runSlackAction(act({ kind: "approve_claim" }), deps({ approveClaim: async () => ({ ok: false, reason: "taken" }) }), when)).result, /already claimed/);
});

test("the name in the note is cleaned", async () => {
  calls.length = 0;
  await runSlackAction(act({ userName: "st<script>eve" }), deps(), when);
  assert.ok(!calls[0].includes("<"));
});
