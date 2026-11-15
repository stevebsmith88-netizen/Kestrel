// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { alertMessage, ephemeral, resultMessage } from "./slack-blocks.ts";
import { DECLINE_CLAIM, SEND_BACK_JOB, declineClaimButton, modalButtonsAllowed, noteProblem, parseModalSubmit, sendBackButton, APPROVE_CLAIM, APPROVE_JOB, approveClaimButton, approveJobButton, buttonsAllowed, claimMayBeApprovedFromSlack, jobMayBeApprovedFromSlack, parseApprovers, parseSlackAction } from "./slack-approvals.ts";

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
  assert.deepEqual(parseSlackAction(press()), { kind: "approve_job", id: ID, userId: "U0ABC123", userName: "steve", responseUrl: "https://hooks.slack.com/actions/T0/1/abc", triggerId: "" });
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

import { approvalStatus } from "./slack-approvals.ts";

test("the check says what is missing, and never shows a value", () => {
  const ok = approvalStatus({ SLACK_SIGNING_SECRET: "abc", SLACK_APPROVER_IDS: "U0ABC123" });
  assert.equal(ok.ready, true);
  assert.deepEqual(ok.problems, []);
  assert.equal(ok.approversValid, 1);
  const none = approvalStatus({});
  assert.equal(none.ready, false);
  assert.equal(none.problems.length, 2);
  const wrongShape = approvalStatus({ SLACK_SIGNING_SECRET: "abc", SLACK_APPROVER_IDS: "@steve" });
  assert.equal(wrongShape.ready, false);
  assert.equal(wrongShape.approversGiven, 1);
  assert.equal(wrongShape.approversValid, 0);
  assert.match(wrongShape.problems[0], /capital U or W/);
  const demo = approvalStatus({ SLACK_SIGNING_SECRET: "abc", SLACK_APPROVER_IDS: "U0ABC123", DEMO_MODE: "yes" });
  assert.equal(demo.ready, false);
  assert.match(demo.problems[0], /demo/);
  assert.ok(!JSON.stringify(ok).includes("abc") && !JSON.stringify(ok).includes("U0ABC123"), "no value leaks");
});

const submit = (over: Record<string, unknown> = {}) => ({
  type: "view_submission",
  user: { id: "U0ABC123", name: "steve" },
  view: { callback_id: SEND_BACK_JOB, private_metadata: JSON.stringify({ id: ID, responseUrl: "https://hooks.slack.com/actions/T0/1/abc", original: "A job is waiting" }), state: { values: { note: { note_input: { value: "  The pay range is too wide, please narrow it.  " } } } } },
  ...over,
});

test("Send back and Decline need the bot token as well, and open a form instead of asking Are you sure", () => {
  const base = { SLACK_SIGNING_SECRET: "s", SLACK_APPROVER_IDS: "U0ABC123" };
  assert.equal(modalButtonsAllowed(base), false, "no bot token, no form");
  assert.equal(modalButtonsAllowed({ ...base, SLACK_BOT_TOKEN: "xoxb-1" }), true);
  assert.equal(modalButtonsAllowed({ ...base, SLACK_BOT_TOKEN: "xoxb-1", DEMO_MODE: "yes" }), false, "never on the demo");
  assert.equal(sendBackButton(ID).confirmTitle, undefined);
  assert.equal(declineClaimButton(ID).style, "danger");
  const msg = alertMessage("hi", [approveJobButton(ID), sendBackButton(ID)]) as { blocks: { elements?: { confirm?: unknown; style?: string }[] }[] };
  assert.ok(msg.blocks[1].elements?.[0].confirm, "Approve asks first");
  assert.equal(msg.blocks[1].elements?.[1].confirm, undefined, "Send back opens a form instead");
  assert.equal(msg.blocks[1].elements?.[1].style, undefined);
});

test("a press of Send back or Decline is read, with the id Slack gave", () => {
  assert.equal(parseSlackAction(press({ trigger_id: "13345224609.738474920.8088930838d88f008e0", actions: [{ action_id: SEND_BACK_JOB, value: ID }] }))?.kind, "send_back_job");
  assert.equal(parseSlackAction(press({ trigger_id: "t", actions: [{ action_id: DECLINE_CLAIM, value: ID }] }))?.triggerId, "t");
  assert.equal(parseSlackAction(press({ actions: [{ action_id: DECLINE_CLAIM, value: "nope" }] })), null);
});

test("the submitted form is read, and a wrong one is not", () => {
  const got = parseModalSubmit(submit());
  assert.equal(got?.kind, "send_back_job");
  assert.equal(got?.id, ID);
  assert.equal(got?.note, "  The pay range is too wide, please narrow it.  ");
  assert.equal(got?.userId, "U0ABC123");
  assert.equal(parseModalSubmit(submit({ type: "block_actions" })), null);
  assert.equal(parseModalSubmit(submit({ view: { callback_id: "other", private_metadata: "{}", state: {} } })), null);
  assert.equal(parseModalSubmit(submit({ view: { callback_id: SEND_BACK_JOB, private_metadata: "not json", state: {} } })), null);
  assert.equal(parseModalSubmit(submit({ view: { callback_id: SEND_BACK_JOB, private_metadata: JSON.stringify({ id: "x" }), state: {} } })), null);
});

test("a note must say something useful", () => {
  assert.match(noteProblem("too short") ?? "", /at least 10/);
  assert.equal(noteProblem("Please narrow the pay range."), null);
  assert.match(noteProblem("x".repeat(1001)) ?? "", /under 1000/);
});

test("the check also says whether Send back and Decline are ready", () => {
  const withToken = approvalStatus({ SLACK_SIGNING_SECRET: "a", SLACK_APPROVER_IDS: "U0ABC123", SLACK_BOT_TOKEN: "xoxb-1" });
  assert.equal(withToken.sendBackReady, true);
  assert.equal(withToken.botTokenSet, true);
  const without = approvalStatus({ SLACK_SIGNING_SECRET: "a", SLACK_APPROVER_IDS: "U0ABC123" });
  assert.equal(without.ready, true, "Approve works without the token");
  assert.equal(without.sendBackReady, false);
  assert.ok(!JSON.stringify(withToken).includes("xoxb"), "no value leaks");
});
