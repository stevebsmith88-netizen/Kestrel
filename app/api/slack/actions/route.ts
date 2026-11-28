import { after } from "next/server";
import { approveClaimCore, rejectClaimCore } from "@/lib/claim-approval";
import { approveJobNow, rejectJobNow } from "@/lib/job-approval";
import { withExpected } from "@/lib/expected-columns";
import { REVIEW_COLUMNS, loadQueueJob } from "@/lib/review-queue";
import { parseModalSubmit, parseSlackAction, noteProblem, SEND_BACK_JOB, DECLINE_CLAIM } from "@/lib/slack-approvals";
import { NOT_APPROVER_MESSAGE, isApprover, runSlackAction, runSlackDecision } from "@/lib/slack-actions-core";
import { ephemeral, noteModal, resultMessage } from "@/lib/slack-blocks";
import { demoMode } from "@/lib/demo";
import { verifySlackSignature } from "@/lib/slack-signature";
import { supabaseAdmin } from "@/lib/supabase-server";

// Where Slack sends a button press or a submitted form (Steve, 14th November 2026; plan in docs/plans/slack-approvals.md). Every message is checked first:
// it must be signed by Slack with SLACK_SIGNING_SECRET and be fresh, and the person must be on the SLACK_APPROVER_IDS list. Slack wants an answer in
// 3 seconds, so this answers at once and does the work afterwards, then updates the message in Slack with the result. The only thing done before
// answering is opening the form for Send back and Decline, because Slack lets a form be opened for only 3 seconds after the press.
export const dynamic = "force-dynamic";

const ok = () => new Response(null, { status: 200 });

async function reply(url: string, body: unknown) {
  // Only an address Slack itself gave, on Slack's own host, is ever posted to.
  if (!url.startsWith("https://hooks.slack.com/")) return;
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
  } catch (e) {
    console.error("Slack reply not sent:", e instanceof Error ? e.name : "error");
  }
}

// Opens the note form. Returns Slack's own error code when it could not, so the person is told why.
async function openForm(triggerId: string, view: unknown): Promise<string | null> {
  const token = process.env.SLACK_BOT_TOKEN?.trim();
  if (!token) return "no_bot_token";
  try {
    const response = await fetch("https://slack.com/api/views.open", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ trigger_id: triggerId, view }),
      signal: AbortSignal.timeout(2500),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    return data.ok ? null : String(data.error ?? "unknown_error").slice(0, 60);
  } catch {
    return "request_failed";
  }
}

export async function POST(request: Request) {
  // Approving from Slack is for the live site only. The demo never answers, whatever its settings say (audit P2-07).
  if (demoMode()) return new Response("Not found", { status: 404 });
  const raw = await request.text();
  const valid = verifySlackSignature({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    timestamp: request.headers.get("x-slack-request-timestamp"),
    signature: request.headers.get("x-slack-signature"),
    body: raw,
  });
  if (!valid) return new Response("Not allowed", { status: 401 });
  // Slack repeats a message it thinks was not answered. The first one is already being handled.
  if (request.headers.get("x-slack-retry-num")) return ok();

  let payload: unknown = null;
  try {
    payload = JSON.parse(new URLSearchParams(raw).get("payload") ?? "null");
  } catch {
    return ok();
  }

  // The form was submitted: check the note now, so a mistake shows inside the form, and do the work afterwards.
  const submitted = parseModalSubmit(payload);
  if (submitted) {
    if (!isApprover(submitted.userId, process.env)) return Response.json({ response_action: "errors", errors: { note: NOT_APPROVER_MESSAGE } });
    const problem = noteProblem(submitted.note);
    if (problem) return Response.json({ response_action: "errors", errors: { note: problem } });
    after(async () => {
      const db = supabaseAdmin();
      if (!db) return reply(submitted.responseUrl, ephemeral("The database is not connected, so nothing was done."));
      const outcome = await runSlackDecision(submitted, {
        env: process.env,
        jobWaiting: async (id) => Boolean(await loadQueueJob(db, id, await withExpected(REVIEW_COLUMNS))),
        sendBackJob: (id, note, via) => rejectJobNow(id, note, via),
        claimPending: async (id) => (await db.from("listing_claims").select("status").eq("id", id).maybeSingle()).data?.status === "pending_review",
        declineClaim: (id, note) => rejectClaimCore(db, id, note),
      });
      await reply(submitted.responseUrl, outcome.ok ? resultMessage(submitted.original, outcome.result) : ephemeral(outcome.result));
    });
    return ok();
  }

  const action = parseSlackAction(payload);
  if (!action) return ok();
  const original = String((payload as { message?: { text?: string } }).message?.text ?? "");

  // Send back and Decline: open the form for the note. Only an approver gets one.
  if (action.kind === "send_back_job" || action.kind === "decline_claim") {
    if (!isApprover(action.userId, process.env)) {
      after(() => reply(action.responseUrl, ephemeral(NOT_APPROVER_MESSAGE)));
      return ok();
    }
    const sendBack = action.kind === "send_back_job";
    const failure = await openForm(
      action.triggerId,
      noteModal({
        callbackId: sendBack ? SEND_BACK_JOB : DECLINE_CLAIM,
        title: sendBack ? "Send back to clinic" : "Decline this claim",
        label: sendBack ? "What should the clinic change?" : "Why is it declined?",
        submit: sendBack ? "Send back" : "Decline",
        hint: sendBack ? "This is emailed to the clinic exactly as you write it." : "This is emailed to the person who made the claim exactly as you write it.",
        metadata: { id: action.id, responseUrl: action.responseUrl, original },
      }),
    );
    if (failure) {
      const why = failure === "no_bot_token" ? "SLACK_BOT_TOKEN is not set, so the form cannot open. Use the review queue instead." : `Slack would not open the form (${failure}). Use the review queue instead.`;
      after(() => reply(action.responseUrl, ephemeral(why)));
    }
    return ok();
  }

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
  return ok();
}
