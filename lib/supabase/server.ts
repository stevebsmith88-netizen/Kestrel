import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/supabase/config";

// Server client that acts as the signed in person (it reads their session from
// cookies), so row level security applies. For admin work that must bypass it,
// use supabaseAdmin in lib/supabase-server.ts instead.
export async function supabaseServer() {
  const config = supabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a page, where cookies are read only. The proxy keeps the session fresh.
        }
      },
    },
  });
}
