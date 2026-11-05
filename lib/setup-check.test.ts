// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { explainClaudeError, setupChecks } from "./setup-check.ts";

const find = (checks: ReturnType<typeof setupChecks>, start: string) => checks.find((c) => c.label.startsWith(start))!;

test("a missing key is named, and a good one is never shown", () => {
  assert.equal(find(setupChecks({}), "ANTHROPIC_API_KEY").ok, false);
  const key = "sk-ant-api03-SECRETSECRETSECRET";
  const good = setupChecks({ ANTHROPIC_API_KEY: key });
  assert.equal(find(good, "ANTHROPIC_API_KEY").ok, true);
  assert.ok(!JSON.stringify(good).includes("SECRET"), "the key never appears");
  assert.match(find(good, "ANTHROPIC_API_KEY").detail, /Set, 31 characters/);
});

test("common slips in pasting the key are spotted", () => {
  for (const bad of [" sk-ant-abc", "sk-ant-abc\n", "\"sk-ant-abc\"", "abc123"]) assert.equal(find(setupChecks({ ANTHROPIC_API_KEY: bad }), "ANTHROPIC_API_KEY").ok, false, bad);
});

test("it says which copy of the site this is", () => {
  assert.match(find(setupChecks({ DEMO_MODE: "yes" }), "You are on").detail, /demo site/);
  assert.match(find(setupChecks({ VERCEL_ENV: "production", VERCEL_GIT_COMMIT_SHA: "abcdef1234567" }), "You are on").detail, /live site, build abcdef1/);
  assert.match(find(setupChecks({ VERCEL_ENV: "preview" }), "You are on").detail, /preview/);
  assert.match(find(setupChecks({ ENABLE_SEEDING: "yes" }), "Publishing").detail, /^On/);
});

test("errors from Anthropic become plain next steps without the key", () => {
  assert.match(explainClaudeError(400, "This API key is not scoped to a workspace, so this request must include the anthropic-workspace-id header"), /workspace/);
  assert.match(explainClaudeError(401, "invalid x-api-key"), /did not accept the key/);
  assert.match(explainClaudeError(400, "Your credit balance is too low"), /no credit/);
  assert.match(explainClaudeError(400, "web_search tool is not enabled for your organization"), /Web search is not switched on/);
  assert.ok(!explainClaudeError(500, "oops sk-ant-api03-SECRET").includes("SECRET"));
});
