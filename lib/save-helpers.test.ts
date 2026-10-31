// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { updateThenInsert } from "./save-helpers.ts";

type Step = { updated: { id: string }[]; insertError?: { code: string; message: string } };

// A stand in for the database client that records what was asked of it.
function fake(steps: Step[]) {
  const calls: string[] = [];
  let n = 0;
  const db = {
    from: () => ({
      update: () => ({ match: () => ({ select: async () => { calls.push("update"); return { data: steps[Math.min(n++, steps.length - 1)].updated, error: null }; } }) }),
      insert: async () => { calls.push("insert"); return { error: steps[0].insertError ?? null }; },
    }),
  } as unknown as SupabaseClient;
  return { db, calls };
}

test("an existing row is updated and nothing is added", async () => {
  const { db, calls } = fake([{ updated: [{ id: "1" }] }]);
  assert.deepEqual(await updateThenInsert(db, "t", { a: 1 }, { b: 2 }, { a: 1, b: 2 }), { error: null });
  assert.deepEqual(calls, ["update"]);
});

test("a new row is added when the update matches nothing", async () => {
  const { db, calls } = fake([{ updated: [] }]);
  assert.deepEqual(await updateThenInsert(db, "t", { a: 1 }, { b: 2 }, { a: 1, b: 2 }), { error: null });
  assert.deepEqual(calls, ["update", "insert"]);
});

test("if another save added the row first, this one updates it", async () => {
  const { db, calls } = fake([{ updated: [], insertError: { code: "23505", message: "duplicate" } }, { updated: [{ id: "1" }] }]);
  assert.deepEqual(await updateThenInsert(db, "t", { a: 1 }, { b: 2 }, { a: 1, b: 2 }), { error: null });
  assert.deepEqual(calls, ["update", "insert", "update"]);
});

test("a real database error is passed back", async () => {
  const { db } = fake([{ updated: [], insertError: { code: "P0001", message: "You can save up to 5 cover letters." } }]);
  const result = await updateThenInsert(db, "t", { a: 1 }, { b: 2 }, { a: 1, b: 2 });
  assert.match(result.error?.message ?? "", /up to 5/);
});
