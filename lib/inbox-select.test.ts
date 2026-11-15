// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { idsFrom } from "./inbox-select.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

test("only valid ids are taken, once each", () => {
  const f = new FormData();
  for (const v of [A, B, A, "not-an-id", "'; drop table notifications; --", ""]) f.append("ids", v);
  assert.deepEqual(idsFrom(f), [A, B]);
});

test("no more than 100 are taken at once", () => {
  const f = new FormData();
  for (let i = 0; i < 150; i++) f.append("ids", `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
  assert.equal(idsFrom(f).length, 100);
});

test("deleting and marking are limited to the signed in person's own messages", () => {
  const src = readFileSync("lib/notification-actions.ts", "utf8");
  assert.match(src, /\.delete\(\)\.in\("id", ids\)\.eq\("user_id", session\.userId\)/);
  assert.match(src, /\.in\("id", ids\)\.eq\("user_id", session\.userId\)\.is\("read_at", null\)/);
});
