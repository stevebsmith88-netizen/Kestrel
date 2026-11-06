import { isBotAgent, parseEvent } from "@/lib/job-stats";
import { isOwnerOrAdmin, recordJobEvent } from "@/lib/job-stats-data";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };
const done = () => new Response(null, { status: 204, headers });

// Counts a job view or an apply click. It always answers 204 so nothing on the page waits for it or shows an error.
// Nothing is stored about the visitor: only a count for the job and the day (migration 0030).
export async function POST(request: Request) {
  if (isBotAgent(request.headers.get("user-agent"))) return done();
  if (/prefetch|prerender/i.test(request.headers.get("sec-purpose") ?? request.headers.get("purpose") ?? "")) return done();
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return done();

  let body: unknown = null;
  try {
    const text = await request.text();
    if (text.length > 300) return done();
    body = JSON.parse(text);
  } catch {
    return done();
  }
  const event = parseEvent(body);
  if (!event) return done();
  if (await isOwnerOrAdmin(event.jobId)) return done();
  await recordJobEvent(event.jobId, event.kind);
  return done();
}
