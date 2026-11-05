// Run with: npm test
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { actionFor, webhookIsGenuine } from "./resend-webhook.ts";

const KEY = Buffer.from("a test signing key for kestrel");
const SECRET = `whsec_${KEY.toString("base64")}`;
const NOW = 1_800_000_000;
const sign = (id: string, ts: string, body: string, key = KEY) => `v1,${createHmac("sha256", key).update(`${id}.${ts}.${body}`).digest("base64")}`;

test("a correctly signed, recent message is accepted", () => {
  const body = '{"type":"email.bounced"}';
  assert.equal(webhookIsGenuine(SECRET, { id: "msg_1", timestamp: String(NOW), signature: sign("msg_1", String(NOW), body) }, body, NOW), true);
});

test("a wrong signature, a changed body, an old message or no secret is refused", () => {
  const body = '{"type":"email.bounced"}';
  const good = sign("msg_1", String(NOW), body);
  assert.equal(webhookIsGenuine(SECRET, { id: "msg_1", timestamp: String(NOW), signature: sign("msg_1", String(NOW), body, Buffer.from("wrong")) }, body, NOW), false);
  assert.equal(webhookIsGenuine(SECRET, { id: "msg_1", timestamp: String(NOW), signature: good }, body + " ", NOW), false);
  assert.equal(webhookIsGenuine(SECRET, { id: "msg_1", timestamp: String(NOW - 600), signature: sign("msg_1", String(NOW - 600), body) }, body, NOW), false);
  assert.equal(webhookIsGenuine(undefined, { id: "msg_1", timestamp: String(NOW), signature: good }, body, NOW), false);
});

test("one matching signature among several is enough, for when the secret is being changed", () => {
  const body = "{}";
  const both = `v1,${Buffer.from("old").toString("base64")} ${sign("msg_2", String(NOW), body)}`;
  assert.equal(webhookIsGenuine(SECRET, { id: "msg_2", timestamp: String(NOW), signature: both }, body, NOW), true);
});

test("a hard bounce or a spam complaint puts the address on the do not email list", () => {
  assert.deepEqual(actionFor({ type: "email.bounced", data: { to: ["Hiring@Clinic.ca"], bounce: { type: "Permanent" } } }), { addresses: ["hiring@clinic.ca"], reason: "bounced" });
  assert.deepEqual(actionFor({ type: "email.complained", data: { to: ["hiring@clinic.ca"] } }), { addresses: ["hiring@clinic.ca"], reason: "complaint" });
});

test("a temporary bounce, a delivery or a bad message does nothing", () => {
  assert.equal(actionFor({ type: "email.bounced", data: { to: ["hiring@clinic.ca"], bounce: { type: "Transient" } } }), null);
  assert.equal(actionFor({ type: "email.delivered", data: { to: ["hiring@clinic.ca"] } }), null);
  assert.equal(actionFor({ type: "email.bounced", data: { to: ["not an address"] } }), null);
  assert.equal(actionFor("nonsense"), null);
});
