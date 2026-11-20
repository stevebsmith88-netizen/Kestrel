import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

// Expected earnings (migration 0043) live in 3 new job columns. Until Steve has run the SQL on a database, asking for them would break
// every page that reads jobs, so they are added to a read only once the database has them, and left out of a write until then.
// The answer is remembered: for good once the columns are there, and for 5 minutes while they are not.
export const EXPECTED_COLUMNS = ["pay_expected_min", "pay_expected_max", "pay_expected_period"] as const;
let ready = false;
let checkedAt = 0;

export async function expectedColumnsReady(): Promise<boolean> {
  if (ready || Date.now() - checkedAt < 5 * 60 * 1000) return ready;
  checkedAt = Date.now();
  const admin = supabaseAdmin();
  if (!admin) return false;
  const { error } = await admin.from("jobs").select("pay_expected_min").limit(1);
  ready = !error;
  return ready;
}

// The optional headline (migration 0053) is held back the same way, on its own, because the 2 migrations can be run on different days.
let headlineIsReady = false;
let headlineCheckedAt = 0;

export async function headlineColumnReady(): Promise<boolean> {
  if (headlineIsReady || Date.now() - headlineCheckedAt < 5 * 60 * 1000) return headlineIsReady;
  headlineCheckedAt = Date.now();
  const admin = supabaseAdmin();
  if (!admin) return false;
  const { error } = await admin.from("jobs").select("headline").limit(1);
  headlineIsReady = !error;
  return headlineIsReady;
}

// The sort date (migration 0061) is held back the same way. Until the SQL is run, Newest keeps sorting on posted_at.
let sortIsReady = false;
let sortCheckedAt = 0;

export async function sortColumnReady(): Promise<boolean> {
  if (sortIsReady || Date.now() - sortCheckedAt < 5 * 60 * 1000) return sortIsReady;
  sortCheckedAt = Date.now();
  const admin = supabaseAdmin();
  if (!admin) return false;
  const { error } = await admin.from("jobs").select("sort_at").limit(1);
  sortIsReady = !error;
  return sortIsReady;
}

// The column the Newest list is ordered by: the later of when a job went live and when it was last extended, so an extended job goes back
// to the top (Steve, 20th November 2026). posted_at itself never moves: Google's date, the alert emails and the "first posted" date use it.
export async function newestColumn(): Promise<"sort_at" | "posted_at"> {
  return (await sortColumnReady()) ? "sort_at" : "posted_at";
}

// Columns for a public read of jobs: the usual ones plus the sort date once the database has it. Never used for a write, because the sort date is
// worked out by the database and cannot be saved.
export async function withPublic(columns: string): Promise<string> {
  const base = await withExpected(columns);
  return (await sortColumnReady()) ? `${base}, sort_at` : base;
}

// ", pay_expected_min, pay_expected_max, pay_expected_period" and ", headline" once the database has them, otherwise nothing.
export async function withExpected(columns: string): Promise<string> {
  let out = columns;
  if (await expectedColumnsReady()) out = `${out}, ${EXPECTED_COLUMNS.join(", ")}`;
  if (await headlineColumnReady()) out = `${out}, headline`;
  return out;
}

// A job row without the columns the database does not have yet.
export async function fitExpected<T extends Record<string, unknown>>(row: T): Promise<T> {
  const copy: Record<string, unknown> = { ...row };
  if (!(await expectedColumnsReady())) for (const c of EXPECTED_COLUMNS) delete copy[c];
  if (!(await headlineColumnReady())) delete copy.headline;
  return copy as T;
}
