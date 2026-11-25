// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { changeName, type NameDb } from "./name-change.ts";

const now = new Date("2026-11-12T12:00:00Z");

// A small stand in for the database. It records every write. `noHoldColumn` copies a database before migration 0039, and `failWrite` a write
// that goes wrong.
function fakeDb(profile: Record<string, unknown>, options: { noHoldColumn?: boolean; failWrite?: boolean } = {}) {
  const writes: Record<string, unknown>[] = [];
  const db: NameDb = {
    from() {
      return {
        select(columns: string) {
          const missing = options.noHoldColumn && columns.includes("name_changed_at");
          const result = missing ? { data: null, error: { code: "42703", message: "column profiles.name_changed_at does not exist" } } : { data: profile, error: null };
          return { eq: () => ({ maybeSingle: () => Promise.resolve(result) }) };
        },
        update(values: Record<string, unknown>) {
          writes.push(values);
          return { eq: () => Promise.resolve(options.failWrite ? { data: null, error: { message: "write failed" } } : { data: null, error: null }) };
        },
      };
    },
  };
  return { db, writes };
}

test("with no server key the change is refused, so a name is never saved without its hold", async () => {
  assert.deepEqual(await changeName(null, "u1", { first: "Jane", last: "Doe" }, "", now), { outcome: "no-server" });
});

test("a change saves the name and the hold date together, in 1 write", async () => {
  const { db, writes } = fakeDb({ first_name: "Jane", last_name: "Smith", name_changed_at: null });
  assert.deepEqual(await changeName(db, "u1", { first: "Jane", last: "Doe" }, "", now), { outcome: "saved", held: true });
  assert.deepEqual(writes, [{ first_name: "Jane", last_name: "Doe", full_name: "Jane Doe", name_changed_at: "2026-11-12T12:00:00.000Z" }]);
});

test("the first change starts the hold too (Steve, 12th November 2026)", async () => {
  const { db, writes } = fakeDb({ first_name: "Jane", last_name: "", name_changed_at: null });
  const result = await changeName(db, "u1", { first: "Jane", last: "Smith" }, "", now);
  assert.equal(result.outcome, "saved");
  assert.ok(writes[0].name_changed_at, "the first change must set the hold date");
});

test("during the hold nothing is written", async () => {
  const { db, writes } = fakeDb({ first_name: "Jane", last_name: "Smith", name_changed_at: "2026-11-01T12:00:00Z" });
  const result = await changeName(db, "u1", { first: "Jane", last: "Doe" }, "", now);
  assert.equal(result.outcome, "locked");
  assert.equal(result.outcome === "locked" && result.until.toISOString(), "2026-12-01T12:00:00.000Z");
  assert.equal(writes.length, 0);
});

test("after 30 days the name can change again", async () => {
  const { db } = fakeDb({ first_name: "Jane", last_name: "Smith", name_changed_at: "2026-10-01T12:00:00Z" });
  assert.equal((await changeName(db, "u1", { first: "Jane", last: "Doe" }, "", now)).outcome, "saved");
});

test("the same name again writes nothing and starts no hold", async () => {
  const { db, writes } = fakeDb({ first_name: "Jane", last_name: "Smith", name_changed_at: null });
  assert.deepEqual(await changeName(db, "u1", { first: " Jane ", last: "Smith" }, "", now), { outcome: "unchanged" });
  assert.equal(writes.length, 0);
});

test("fixing capital letters alone saves the name with no hold, even during a hold (Steve, 12th November 2026)", async () => {
  const fresh = fakeDb({ first_name: "jane", last_name: "smith", name_changed_at: null });
  assert.deepEqual(await changeName(fresh.db, "u1", { first: "Jane", last: "Smith" }, "", now), { outcome: "saved", held: false });
  assert.deepEqual(fresh.writes, [{ first_name: "Jane", last_name: "Smith", full_name: "Jane Smith" }], "no hold date is written");
  const held = fakeDb({ first_name: "jane", last_name: "smith", name_changed_at: "2026-11-01T12:00:00Z" });
  assert.deepEqual(await changeName(held.db, "u1", { first: "Jane", last: "Smith" }, "", now), { outcome: "saved", held: false });
  assert.equal(held.writes[0].name_changed_at, undefined, "an existing hold is left as it is");
});

test("before migration 0039 the name still saves, with no hold, as it does today", async () => {
  const { db, writes } = fakeDb({ first_name: "Jane", last_name: "Smith" }, { noHoldColumn: true });
  assert.deepEqual(await changeName(db, "u1", { first: "Jane", last: "Doe" }, "", now), { outcome: "saved", held: false });
  assert.deepEqual(writes, [{ first_name: "Jane", last_name: "Doe", full_name: "Jane Doe" }]);
});

test("a failed write is reported and leaves no half change", async () => {
  const { db, writes } = fakeDb({ first_name: "Jane", last_name: "Smith", name_changed_at: null }, { failWrite: true });
  assert.equal((await changeName(db, "u1", { first: "Jane", last: "Doe" }, "", now)).outcome, "failed");
  assert.equal(writes.length, 1, "the name and the hold go in the same write, so there is no second write to fail on its own");
});

test("the account page's action saves names through the server key only", () => {
  const source = readFileSync("lib/account-settings-actions.ts", "utf8");
  const action = source.slice(source.indexOf("export async function updateName"), source.indexOf("export async function requestEmailChange"));
  assert.match(action, /const admin = supabaseAdmin\(\);/, "updateName must use the server client");
  assert.match(action, /changeName\(admin as unknown as NameDb/, "updateName must hand the server client to changeName");
  assert.doesNotMatch(action, /db\.from\("profiles"\)\.update/, "updateName must not write the name with the person's own sign in");
});

test("no real change of name while an application is still in play, but capitals can be fixed (Steve, 13th November 2026)", async () => {
  const a = fakeDb({ first_name: "Jane", last_name: "Smith", name_changed_at: null });
  assert.deepEqual(await changeName(a.db, "u1", { first: "Jane", last: "Doe" }, "", now, { inPlay: true }), { outcome: "in-play" });
  assert.equal(a.writes.length, 0, "nothing is saved");
  const b = fakeDb({ first_name: "jane", last_name: "smith", name_changed_at: null });
  assert.deepEqual(await changeName(b.db, "u1", { first: "Jane", last: "Smith" }, "", now, { inPlay: true }), { outcome: "saved", held: false });
  const c = fakeDb({ first_name: "Jane", last_name: "Smith", name_changed_at: null });
  assert.equal((await changeName(c.db, "u1", { first: "Jane", last: "Doe" }, "", now, { inPlay: false })).outcome, "saved", "with nothing in play the change goes through");
});
