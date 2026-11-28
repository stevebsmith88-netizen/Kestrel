import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isJobId, savedState, setSaved } from "@/lib/saved-server";

// Save a job to apply for later, for the Save button on job pages. Those pages are saved once and shown to everyone, so the button asks here,
// in the browser, whether the signed in person has saved the job. Private and never stored along the way.
export const dynamic = "force-dynamic";
const PRIVATE = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: Request) {
  const job = new URL(request.url).searchParams.get("job");
  if (!isJobId(job)) return NextResponse.json({ state: "hidden" }, { status: 400, headers: PRIVATE });
  return NextResponse.json({ state: await savedState(await getSession(), job) }, { headers: PRIVATE });
}

export async function POST(request: Request) {
  // Only JSON from this website's own pages: a form on another site cannot send this.
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return NextResponse.json({ error: "Not accepted." }, { status: 415, headers: PRIVATE });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return NextResponse.json({ error: "Not accepted." }, { status: 403, headers: PRIVATE });
  const session = await getSession();
  if (!session) return NextResponse.json({ state: "signed-out", error: "Sign in to save jobs." }, { status: 401, headers: PRIVATE });
  let body: { job?: unknown; save?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Not accepted." }, { status: 400, headers: PRIVATE });
  }
  if (!isJobId(body.job) || typeof body.save !== "boolean") return NextResponse.json({ error: "Not accepted." }, { status: 400, headers: PRIVATE });
  return NextResponse.json(await setSaved(session, body.job, body.save), { headers: PRIVATE });
}
