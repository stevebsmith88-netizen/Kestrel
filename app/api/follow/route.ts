import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { followState, isEmployerId, setFollow } from "@/lib/follow-server";

// Follow a clinic or company, for the Follow button on public pages. Those pages are saved once and shown to everyone, so the button asks here,
// in the browser, whether the signed in person follows. Private and never stored along the way.
export const dynamic = "force-dynamic";
const PRIVATE = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: Request) {
  const employer = new URL(request.url).searchParams.get("employer");
  if (!isEmployerId(employer)) return NextResponse.json({ state: "hidden" }, { status: 400, headers: PRIVATE });
  return NextResponse.json({ state: await followState(await getSession(), employer) }, { headers: PRIVATE });
}

export async function POST(request: Request) {
  // Only JSON from this website's own pages: a form on another site cannot send this.
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) return NextResponse.json({ error: "Not accepted." }, { status: 415, headers: PRIVATE });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return NextResponse.json({ error: "Not accepted." }, { status: 403, headers: PRIVATE });
  const session = await getSession();
  if (!session) return NextResponse.json({ state: "signed-out", error: "Sign in to follow." }, { status: 401, headers: PRIVATE });
  let body: { employer?: unknown; follow?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Not accepted." }, { status: 400, headers: PRIVATE });
  }
  if (!isEmployerId(body.employer) || typeof body.follow !== "boolean") return NextResponse.json({ error: "Not accepted." }, { status: 400, headers: PRIVATE });
  return NextResponse.json(await setFollow(session, body.employer, body.follow), { headers: PRIVATE });
}
