import "server-only";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { MAX_FAILURES, afterFailure, attemptKey, currentFailures, needsCheck, type Attempt } from "@/lib/sign-in-limits";

// The database half of the sign in guard (audit R22). It never blocks a sign in because of its own trouble:
// if the table cannot be read or written, sign in carries on as before and the problem is logged.

// The keys to count against for one sign in: the email, and the visitor's address as Vercel reports it.
export async function signInKeys(email: string) {
  const h = await headers();
  const visitor = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "";
  return { email: attemptKey("email", email), visitor: visitor ? attemptKey("visitor", visitor) : null };
}

const list = (keys: { email: string; visitor: string | null }) => [keys.email, ...(keys.visitor ? [keys.visitor] : [])];

type Row = Attempt & { key: string };

async function read(keys: string[]): Promise<Row[]> {
  const db = supabaseAdmin();
  if (!db) return [];
  const { data, error } = await db.from("sign_in_attempts").select("key, failures, window_started_at").in("key", keys);
  if (error) {
    console.error("Sign in guard could not read attempts:", error.code, error.message);
    return [];
  }
  return (data ?? []) as Row[];
}

// True when this email or this visitor has used up its 5 attempts, so the bot check is needed.
export async function checkRequired(keys: { email: string; visitor: string | null }) {
  return needsCheck(await read(list(keys)));
}

// Adds one failure to the email and the visitor. Returns true if the bot check is now needed.
export async function recordFailure(keys: { email: string; visitor: string | null }) {
  const db = supabaseAdmin();
  if (!db) return false;
  const now = Date.now();
  const rows = await read(list(keys));
  const updated = list(keys).map((key) => ({ key, ...afterFailure(rows.find((r) => r.key === key), now) }));
  const { error } = await db.from("sign_in_attempts").upsert(updated, { onConflict: "key" });
  if (error) console.error("Sign in guard could not record a failure:", error.code, error.message);
  return updated.some((u) => currentFailures(u, now) >= MAX_FAILURES);
}

// A good sign in clears the email's count. The visitor's count is left to run out, because many people can share one address.
export async function clearFailures(keys: { email: string; visitor: string | null }) {
  const db = supabaseAdmin();
  if (!db) return;
  const { error } = await db.from("sign_in_attempts").delete().eq("key", keys.email);
  if (error) console.error("Sign in guard could not clear attempts:", error.code, error.message);
}
