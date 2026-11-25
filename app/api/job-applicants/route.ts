import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isJobId } from "@/lib/saved-server";
import { supabaseServer } from "@/lib/supabase/server";

// For the View applicants button on a job page, shown only to the clinic that owns the job. The job page is saved once and shown to everyone, so
// it cannot know who is looking: the button asks here, in the browser, with the clinic's own sign in. The database's own rules decide what that
// sign in can read, so a job that is not the clinic's (or its team's) comes back as nothing. Only counts are returned, never a name.
export const dynamic = "force-dynamic";
const PRIVATE = { "Cache-Control": "private, no-store, max-age=0" };
const NONE = { mine: false };

export async function GET(request: Request) {
  const job = new URL(request.url).searchParams.get("job");
  if (!isJobId(job)) return NextResponse.json(NONE, { status: 400, headers: PRIVATE });
  const session = await getSession();
  if (!session || session.role !== "clinic") return NextResponse.json(NONE, { headers: PRIVATE });
  const db = await supabaseServer();
  if (!db) return NextResponse.json(NONE, { headers: PRIVATE });
  const { data: mine } = await db.from("jobs").select("id").eq("id", job).maybeSingle();
  if (!mine) return NextResponse.json(NONE, { headers: PRIVATE });
  const [{ count: total }, { count: waiting }] = await Promise.all([
    db.from("applications").select("id", { count: "exact", head: true }).eq("job_id", job),
    db.from("applications").select("id", { count: "exact", head: true }).eq("job_id", job).in("status", ["applied", "viewed"]),
  ]);
  return NextResponse.json({ mine: true, total: total ?? 0, waiting: waiting ?? 0 }, { headers: PRIVATE });
}
