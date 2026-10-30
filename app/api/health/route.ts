import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// A simple "is the site working" check for an uptime monitor. It confirms the site is up and can
// reach the database, and reveals nothing else.
export async function GET() {
  const db = supabaseAdmin();
  if (!db) return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const { error } = await db.from("waitlist").select("id", { head: true, count: "exact" }).limit(1);
  const ok = !error;
  if (!ok) console.error("Health check failed:", error?.code, error?.message);
  return Response.json({ ok }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
