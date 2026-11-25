// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { signForTest, verifySlackSignature } from "./slack-signature.ts";

const secret = "8f742231b10e8888abcd99yyyzzz85a5";
const now = new Date("2026-11-14T22:00:00Z");
const ts = String(Math.floor(now.getTime() / 1000));
const body = "payload=%7B%22type%22%3A%22block_actions%22%7D";

test("a message signed with the secret, and fresh, is accepted", () => {
  assert.equal(verifySlackSignature({ signingSecret: secret, timestamp: ts, signature: signForTest(secret, ts, body), body, now }), true);
});

test("a wrong secret, a changed body or a missing part is refused", () => {
  const good = signForTest(secret, ts, body);
  assert.equal(verifySlackSignature({ signingSecret: "another", timestamp: ts, signature: good, body, now }), false);
  assert.equal(verifySlackSignature({ signingSecret: secret, timestamp: ts, signature: good, body: body + "x", now }), false);
  assert.equal(verifySlackSignature({ signingSecret: secret, timestamp: null, signature: good, body, now }), false);
  assert.equal(verifySlackSignature({ signingSecret: secret, timestamp: ts, signature: null, body, now }), false);
  assert.equal(verifySlackSignature({ signingSecret: undefined, timestamp: ts, signature: good, body, now }), false, "no secret set refuses everything");
  assert.equal(verifySlackSignature({ signingSecret: secret, timestamp: ts, signature: "v0=abc", body, now }), false);
});

test("a message older than 5 minutes is refused, so an old copy cannot be replayed", () => {
  const old = String(Math.floor(now.getTime() / 1000) - 6 * 60);
  assert.equal(verifySlackSignature({ signingSecret: secret, timestamp: old, signature: signForTest(secret, old, body), body, now }), false);
  const recent = String(Math.floor(now.getTime() / 1000) - 4 * 60);
  assert.equal(verifySlackSignature({ signingSecret: secret, timestamp: recent, signature: signForTest(secret, recent, body), body, now }), true);
});
