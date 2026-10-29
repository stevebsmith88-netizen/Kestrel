import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server only client. Uses the service role key, so it must never be
// imported into a client component.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
