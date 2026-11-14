import { after } from "next/server";
import { approveClaimCore } from "@/lib/claim-approval";
import { approveJobNow } from "@/lib/job-approval";
import { withExpected } from "@/lib/expected-columns";
import { REVIEW_COLUMNS, loadQueueJob } from "@/lib/review-queue";
import { parseSlackAction } from "@/lib/slack-approvals";
import { runSlackAction } from "@/lib/slack-actions-core";
import { ephemeral, resultMessage } from "@/lib/slack-blocks";
import { verifySlackSignature } from "@/lib/slack-signature";
import { supabaseAdmin } from "@/lib/supabase-server";

// Where Slack sends a button press (Steve, 14th November 2026; plan in docs/plans/slack-approvals.md). The message is checked first: it must be
// signed by Slack with SLACK_SIGNING_SECRET and be fresh, and the person must be on the SLACK_APPROVER_IDS list. Slack wants an answer in 3 seconds,
// so this answers at once and does the approval afterwards, then updates the message in Slack with the result.
export const dynamic = "force-dynamic";

async function reply(url: string, body: unknown) {
  // Only an address Slack itself gave, on Slack's own host, is ever posted to.
  if (!url.startsWith("https://hooks.slack.com/")) return;
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
  } catch (e) {
    console.error("Slack reply not sent:", e instanceof Error ? e.name : "error");
  }
}

export async function POST(request: Request) {
  const raw = await request.text();
  const valid = verifySlackSignature({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    timestamp: request.headers.get("x-slack-request-timestamp"),
    signature: request.headers.get("x-slack-signature"),
    body: raw,
  });
  if (!valid) return new Response("Not allowed", { status: 401 });
  // Slack repeats a message it thinks was not answered. The first one is already being handled.
  if (request.headers.get("x-slack-retry-num")) return new Response(null, { status: 200 });

  let payload: unknown = null;
  try {
    payload = JSON.parse(new URLSearchParams(raw).get("payload") ?? "null");
  } catch {
    return new Response(null, { status: 200 });
  }
  const action = parseSlackAction(payload);
  if (!action) return new Response(null, { status: 200 });
  const original = String((payload as { message?: { text?: string } }).message?.text ?? "");

  after(async () => {
    const db = supabaseAdmin();
    if (!db) return reply(action.responseUrl, ephemeral("The database is not connected, so nothing was approved."));
    const outcome = await runSlackAction(action, {
      env: process.env,
      jobFlags: async (id) => (await loadQueueJob(db, id, await withExpected(REVIEW_COLUMNS)))?.flags ?? null,
      approveJob: (id, via) => approveJobNow(id, "admin", via),
      claimState: async (id) => (await db.from("listing_claims").select("method, status").eq("id", id).maybeSingle()).data ?? null,
      approveClaim: (id) => approveClaimCore(db, id),
    });
    await reply(action.responseUrl, outcome.ok ? resultMessage(original, outcome.result) : ephemeral(outcome.result));
  });
  return new Response(null, { status: 200 });
}
