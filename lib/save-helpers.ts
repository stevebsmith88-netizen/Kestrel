import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

// Saves a row that may or may not exist yet: update it, and add it only if nothing matched.
// A single "upsert" does not work for signed in people here, because the database only lets them change
// some columns and an upsert also rewrites the columns that identify the row. It also made the limit on
// saved items refuse a replacement. If two saves of the same item cross, the loser simply updates.
export async function updateThenInsert(db: SupabaseClient, table: string, match: Row, changes: Row, row: Row) {
  const update = () => db.from(table).update(changes).match(match).select("id");
  const first = await update();
  if (first.error || first.data?.length) return { error: first.error };
  const added = await db.from(table).insert(row);
  if (added.error?.code === "23505") return { error: (await update()).error };
  return { error: added.error };
}
