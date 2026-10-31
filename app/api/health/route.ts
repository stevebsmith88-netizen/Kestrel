import { timingSafeEqual } from "node:crypto";
import { dailyStatus, missingSettings } from "@/lib/health";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

// A simple "is the site working" check for an uptime monitor. It fails if the site cannot reach the database, if the
// daily job has not finished well for over 36 hours, or (on the live site only) if a setting that would fail quietly
// is missing. The public answer is just ok or not. Someone who sends the cron secret also gets the names of any missing settings.
export async function GET(request: Request) {
  const db = supabaseAdmin();
  if (!db) return Response.json({ ok: false }, { status: 503, headers });
  const { error } = await db.from("waitlist").select("id", { head: true, count: "exact" }).limit(1);
  if (error) console.error("Health check failed:", error.code, error.message);

  const live = process.env.VERCEL_ENV === "production" && process.env.DEMO_MODE !== "yes";
  const { data: run } = await db.from("job_runs").select("last_ok_at").eq("name", "daily").maybeSingle();
  const daily = live ? dailyStatus(run?.last_ok_at) : "ok";
  const missing = live ? missingSettings() : [];
  if (daily === "late") console.error("Health check: the daily job has not finished well for over 36 hours.");
  if (missing.length) console.error("Health check: settings missing in Production:", missing.join(", "));

  const ok = !error && daily !== "late" && missing.length === 0;
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  const trusted = Boolean(secret) && given.length === expected.length && timingSafeEqual(given, expected);
  return Response.json(trusted ? { ok, database: !error, daily, missingSettings: missing } : { ok }, { status: ok ? 200 : 503, headers });
}
