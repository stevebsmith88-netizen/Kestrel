// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { SLACK_CHANNEL_NAMES, SLACK_CHANNELS, hasOwnWebhook, webhookFor } from "./slack-channels.ts";

const MAIN = "https://hooks.slack.com/services/T0/B0/main";
const JOBS = "https://hooks.slack.com/services/T0/B1/jobs";

test("a channel uses its own address, and falls back to the main one", () => {
  const env = { SLACK_WEBHOOK_URL: MAIN, SLACK_WEBHOOK_URL_JOBS: JOBS };
  assert.equal(webhookFor("jobs", env), JOBS);
  assert.equal(webhookFor("signups", env), MAIN);
  assert.equal(webhookFor(undefined, env), MAIN);
  assert.equal(hasOwnWebhook("jobs", env), true);
  assert.equal(hasOwnWebhook("signups", env), false);
});

test("with nothing set, nothing is sent, and a blank setting counts as not set", () => {
  assert.equal(webhookFor("jobs", {}), undefined);
  assert.equal(webhookFor("jobs", { SLACK_WEBHOOK_URL_JOBS: "  ", SLACK_WEBHOOK_URL: MAIN }), MAIN);
});

test("every channel has a setting name, a suggested channel name and what it is for", () => {
  assert.deepEqual(SLACK_CHANNEL_NAMES.sort(), ["daily", "jobs", "signups", "support"]);
  for (const name of SLACK_CHANNEL_NAMES) {
    const c = SLACK_CHANNELS[name];
    assert.match(c.env, /^SLACK_WEBHOOK_URL_[A-Z]+$/);
    assert.match(c.suggested, /^#kestrel-/);
    assert.ok(c.for.length > 10);
  }
});

import { channelStatuses } from "./slack-channels.ts";

test("the check shows which channels have their own address, use the main one, or are not set", () => {
  const looks = (u: string) => u.startsWith("https://hooks.slack.com/services/");
  const some = channelStatuses({ SLACK_WEBHOOK_URL: MAIN, SLACK_WEBHOOK_URL_JOBS: JOBS }, looks);
  assert.equal(some.find((s) => s.channel === "jobs")?.use, "own");
  assert.equal(some.find((s) => s.channel === "support")?.use, "main");
  assert.ok(some.every((s) => s.ok));
  const none = channelStatuses({}, looks);
  assert.ok(none.every((s) => s.use === "none" && !s.ok));
  const bad = channelStatuses({ SLACK_WEBHOOK_URL: "https://example.com/x" }, looks);
  assert.ok(bad.every((s) => !s.ok));
});
