// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { alertMessage, ephemeral, resultMessage } from "./slack-blocks.ts";
import { APPROVE_CLAIM, APPROVE_JOB, approveClaimButton, approveJobButton, buttonsAllowed, claimMayBeApprovedFromSlack, jobMayBeApprovedFromSlack, parseApprovers, parseSlackAction } from "./slack-approvals.ts";

const ID = "5b1ad8a2-1f0c-4a0e-9d5e-3c1c8d6f3a11";
const press = (over: Record<string, unknown> = {}) => ({ type: "block_actions", user: { id: "U0ABC123", name: "steve" }, response_url: "https://hooks.slack.com/actions/T0/1/abc", actions: [{ action_id: APPROVE_JOB, value: ID }], ...over });

test("only the people on the approver list count, and a bad id is dropped", () => {
  assert.deepEqual([...parseApprovers("U0ABC123, W0XYZ789 ,nonsense,u0lower")], ["U0ABC123", "W0XYZ789"]);
  assert.equal(parseApprovers(undefined).size, 0);
});

test("buttons appear only on the live site, with both settings", () => {
  const ok = { SLACK_SIGNING_SECRET: "s", SLACK_APPROVER_IDS: "U0ABC123" };
  assert.equal(buttonsAllowed(ok), true);
  assert.equal(buttonsAllowed({ ...ok, DEMO_MODE: "yes" }), false, "the demo gets none");
  assert.equal(buttonsAllowed({ SLACK_APPROVER_IDS: "U0ABC123" }), false);
  assert.equal(buttonsAllowed({ SLACK_SIGNING_SECRET: "s" }), false);
});

test("a press of one of our buttons on a real id is read, and anything else is not", () => {
  assert.deepEqual(parseSlackAction(press()), { kind: "approve_job", id: ID, userId: "U0ABC123", userName: "steve", responseUrl: "https://hooks.slack.com/actions/T0/1/abc" });
  assert.equal(parseSlackAction(press({ actions: [{ action_id: APPROVE_CLAIM, value: ID }] }))?.kind, "approve_claim");
  assert.equal(parseSlackAction(press({ actions: [{ action_id: "something_else", value: ID }] })), null);
  assert.equal(parseSlackAction(press({ actions: [{ action_id: APPROVE_JOB, value: "not-an-id" }] })), null);
  assert.equal(parseSlackAction(press({ type: "view_submission" })), null);
  assert.equal(parseSlackAction(press({ user: {} })), null);
  assert.equal(parseSlackAction(null), null);
});

test("a flagged job has no button, and only an email confirmed claim may be approved", () => {
  assert.equal(jobMayBeApprovedFromSlack([]), true);
  assert.equal(jobMayBeApprovedFromSlack(["The title mentions an optometrist"]), false);
  assert.equal(claimMayBeApprovedFromSlack({ method: "email", status: "pending_review" }), true);
  assert.equal(claimMayBeApprovedFromSlack({ method: "manual", status: "pending_review" }), false);
  assert.equal(claimMayBeApprovedFromSlack({ method: "email", status: "approved" }), false);
});

test("the message has its buttons, each asking Are you sure, and the result replaces them", () => {
  assert.deepEqual(alertMessage("hello"), { text: "hello" });
  const msg = alertMessage("A job is waiting", [approveJobButton(ID), approveClaimButton(ID)]) as { blocks: { type: string; elements?: { action_id: string; confirm: unknown }[] }[] };
  assert.equal(msg.blocks[1].type, "actions");
  assert.deepEqual(msg.blocks[1].elements?.map((e) => e.action_id), [APPROVE_JOB, APPROVE_CLAIM]);
  assert.ok(msg.blocks[1].elements?.every((e) => e.confirm));
  const done = resultMessage("A job is waiting", "Approved by steve") as { blocks: unknown[]; replace_original: boolean };
  assert.equal(done.replace_original, true);
  assert.equal(done.blocks.length, 1, "the buttons are gone");
  assert.equal((ephemeral("no") as { response_type: string }).response_type, "ephemeral");
});
