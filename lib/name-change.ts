// Saving a name change (audit P1-16 and P1-33, 12th November 2026). Everything goes through the website's server key: the check on the 30 day
// hold, then the new name and the hold date saved together in one write, so the name can never change without its hold. Signed in people have
// no permission to change the name columns themselves once migration 0040 is run. With no server key, the change is refused.
// On a database without migration 0039 the hold column does not exist yet: the name is saved with no hold, as before.
// Kept free of app imports so it can be tested on its own (lib/name-change.test.ts).
import { nameDiffers, nameLockedUntil, onlyCapitalsDiffer } from "./name-hold.ts";

type Result = { data: unknown; error: { code?: string; message: string } | null };
// The few database calls this needs, so a test can stand in for the database.
export type NameDb = {
  from(table: string): {
    select(columns: string): { eq(column: string, value: string): { maybeSingle(): PromiseLike<Result> } };
    update(values: Record<string, unknown>): { eq(column: string, value: string): PromiseLike<Result> };
  };
};

export type NameChange =
  | { outcome: "unchanged" }
  | { outcome: "saved"; held: boolean }
  | { outcome: "locked"; until: Date }
  | { outcome: "in-play" } // the candidate has an application still in play (Steve, 13th November 2026)
  | { outcome: "no-server" }
  | { outcome: "failed"; reason: string };

const missingColumn = (e: { code?: string; message: string } | null) => Boolean(e && (e.code === "42703" || e.code === "PGRST204" || /name_changed_at/.test(e.message)));

export async function changeName(admin: NameDb | null, userId: string, next: { first: string; last: string }, fallbackFirst = "", now: Date = new Date(), opts: { inPlay?: boolean } = {}): Promise<NameChange> {
  if (!admin) return { outcome: "no-server" };
  const current = await admin.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle();
  if (current.error) return { outcome: "failed", reason: current.error.message };
  const row = current.data as { first_name?: string | null; last_name?: string | null } | null;
  const was = { first: row?.first_name ?? fallbackFirst, last: row?.last_name ?? "" };
  const name = { first_name: next.first, last_name: next.last, full_name: [next.first, next.last].filter(Boolean).join(" ") };
  // Fixing capital letters alone ("smith" to "Smith") is a tidy up: saved as typed, no hold started, and allowed during a hold.
  if (onlyCapitalsDiffer(was, next)) {
    const tidied = await admin.from("profiles").update(name).eq("id", userId);
    return tidied.error ? { outcome: "failed", reason: tidied.error.message } : { outcome: "saved", held: false };
  }
  if (!nameDiffers(was, next)) return { outcome: "unchanged" };
  // No real change of name while an application is still in play, so the clinic always knows who it is talking to. Capitals are fine (above).
  if (opts.inPlay) return { outcome: "in-play" };

  // Read on its own, because the column is missing until migration 0039 is run.
  const held = await admin.from("profiles").select("name_changed_at").eq("id", userId).maybeSingle();
  const hasHoldColumn = !held.error;
  if (held.error && !missingColumn(held.error)) return { outcome: "failed", reason: held.error.message };
  const until = hasHoldColumn ? nameLockedUntil((held.data as { name_changed_at?: string | null } | null)?.name_changed_at, now) : null;
  if (until) return { outcome: "locked", until };

  const saved = await admin.from("profiles").update(hasHoldColumn ? { ...name, name_changed_at: now.toISOString() } : name).eq("id", userId);
  if (saved.error) return { outcome: "failed", reason: saved.error.message };
  return { outcome: "saved", held: hasHoldColumn };
}
