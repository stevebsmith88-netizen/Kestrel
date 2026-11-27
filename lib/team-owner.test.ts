// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { atLocationLimit, LOCATION_MAX, stillSameOwner } from "./team-owner.ts";

// Audit P2-05, P2-06 and P2-07 (27th November 2026). A stand in employers table that applies eq and in, and can count.
type Row = { id: string; owner_id: string | null };
function standIn(rows: Row[]) {
  const db = {
    from: () => ({
      select(_columns: string, opts?: { count?: string; head?: boolean }) {
        let list = rows;
        let single = false;
        const q = {
          eq(c: keyof Row, v: string) { list = list.filter((r) => r[c] === v); return q; },
          in(c: keyof Row, v: string[]) { list = list.filter((r) => v.includes(r[c] as string)); return q; },
          maybeSingle() { single = true; return q; },
          then(resolve: (v: unknown) => void) {
            if (opts?.count) return resolve({ count: list.length, data: null, error: null });
            resolve({ data: single ? (list[0] ?? null) : list, error: null });
          },
        };
        return q;
      },
    }),
  };
  return db as unknown as SupabaseClient;
}

test("an invitation's extra locations are joined only while the main location's owner still owns them", async () => {
  const db = standIn([
    { id: "main", owner_id: "olivia" },
    { id: "east", owner_id: "olivia" },
    { id: "west", owner_id: "someone-else" }, // handed over after the invitation was sent
  ]);
  assert.deepEqual(await stillSameOwner(db, "main", ["east", "west"]), ["east"]);
  assert.deepEqual(await stillSameOwner(db, "main", []), []);
  assert.deepEqual(await stillSameOwner(db, "gone", ["east"]), [], "no extra location when the main one has no owner");
});

test("a hand over is refused once the new owner holds the most locations allowed", async () => {
  const many = Array.from({ length: LOCATION_MAX }, (_, i) => ({ id: `loc-${i}`, owner_id: "big-group" }));
  assert.equal(await atLocationLimit(standIn(many), "big-group"), true);
  assert.equal(await atLocationLimit(standIn(many.slice(1)), "big-group"), false);
  assert.equal(await atLocationLimit(standIn(many), "small-clinic"), false);
});

test("accepting an invitation and handing over a clinic use these checks", () => {
  const source = readFileSync("lib/team-server.ts", "utf8");
  assert.match(source, /for \(const other of await stillSameOwner\(admin, invite\.employer_id, invite\.also_employer_ids \?\? \[\]\)\)/);
  const transfer = source.slice(source.indexOf("export async function transferOwnership"));
  assert.ok(transfer.indexOf("atLocationLimit(admin, newOwnerId)") > 0 && transfer.indexOf("atLocationLimit(admin, newOwnerId)") < transfer.indexOf('update({ owner_id: newOwnerId })'), "the limit is checked before ownership moves");
});

test("the Slack button endpoint refuses on the demo before reading anything", () => {
  const source = readFileSync("app/api/slack/actions/route.ts", "utf8");
  const post = source.slice(source.indexOf("export async function POST"));
  assert.ok(post.indexOf("if (demoMode()) return new Response(\"Not found\", { status: 404 })") > 0);
  assert.ok(post.indexOf("demoMode()") < post.indexOf("request.text()"), "the demo check comes first");
});
