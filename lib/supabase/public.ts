import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase/config";

// A client for public pages. It is never signed in, so it sees only what the
// public is allowed to see (live jobs and their clinics), enforced by the database.
export function supabasePublic() {
  const config = supabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
}
