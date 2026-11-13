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

// ", pay_expected_min, pay_expected_max, pay_expected_period" once the database has them, otherwise nothing.
export async function withExpected(columns: string): Promise<string> {
  return (await expectedColumnsReady()) ? `${columns}, ${EXPECTED_COLUMNS.join(", ")}` : columns;
}

// A job row without the 3 columns when the database does not have them yet.
export async function fitExpected<T extends Record<string, unknown>>(row: T): Promise<T> {
  if (await expectedColumnsReady()) return row;
  const copy: Record<string, unknown> = { ...row };
  for (const c of EXPECTED_COLUMNS) delete copy[c];
  return copy as T;
}
