// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { AI_CRAWLERS, PRIVATE_PATHS } from "./crawlers.ts";

test("ChatGPT, Perplexity and Claude search crawlers are named and allowed", () => {
  for (const bot of ["OAI-SearchBot", "PerplexityBot", "Claude-SearchBot"]) assert.ok((AI_CRAWLERS as readonly string[]).includes(bot), bot);
});

test("account and admin pages stay closed to every crawler", () => {
  for (const path of ["/admin", "/account", "/candidate", "/dashboard", "/sign-in"]) assert.ok((PRIVATE_PATHS as readonly string[]).includes(path), path);
  // both groups in robots.ts use the same list, so a named AI crawler never gets more than "*"
  const robots = readFileSync("app/robots.ts", "utf8");
  assert.equal(robots.match(/disallow: \[\.\.\.PRIVATE_PATHS\]/g)?.length, 2);
});
