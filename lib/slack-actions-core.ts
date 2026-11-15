// What happens when someone presses an Approve button in Slack (Steve, 14th November 2026; plan in docs/plans/slack-approvals.md). The checks and the
// words are here, with the database work passed in, so every rule can be tested. The route (app/api/slack/actions/route.ts) supplies the real work.
import { claimMayBeApprovedFromSlack, jobMayBeApprovedFromSlack, noteProblem, parseApprovers, type ModalSubmit, type SlackAction } from "./slack-approvals.ts";

export type SlackDeps = {
  env: Record<string, string | undefined>;
  jobFlags: (id: string) => Promise<string[] | null>; // null when the job is not waiting for review
  approveJob: (id: string, via: string) => Promise<{ key: string }>;
  claimState: (id: string) => Promise<{ method: string | null; status: string } | null>;
  approveClaim: (id: string) => Promise<{ ok: true; clinicName: string } | { ok: false; reason: string }>;
};

export type SlackOutcome = { ok: boolean; result: string };

// Whether this person may press a button at all. Nothing is opened or done for anyone else.
export const NOT_APPROVER_MESSAGE = "You are not on the list of people who can approve from Slack. Open the admin pages instead.";
export const isApprover = (userId: string, env: Record<string, string | undefined>) => parseApprovers(env.SLACK_APPROVER_IDS).has(userId);

const safeName = (name: string) => name.replace(/[^\w .'-]/g, "").slice(0, 40) || "someone";

export async function runSlackAction(action: SlackAction, deps: SlackDeps, now: Date = new Date()): Promise<SlackOutcome> {
  if (!isApprover(action.userId, deps.env)) return { ok: false, result: NOT_APPROVER_MESSAGE };
  const who = safeName(action.userName);
  const time = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", hour: "numeric", minute: "2-digit" }).format(now);

  if (action.kind === "approve_job") {
    const flags = await deps.jobFlags(action.id);
    if (flags === null) return { ok: false, result: "This job is no longer waiting for review. It may already have been handled." };
    if (!jobMayBeApprovedFromSlack(flags)) return { ok: false, result: "This job changed and now needs a look. Approve it in the review queue." };
    const result = await deps.approveJob(action.id, `from Slack by ${who}`);
    switch (result.key) {
      case "approved": return { ok: true, result: `Approved by ${who} from Slack at ${time}.` };
      case "payment-failed": return { ok: false, result: "The clinic's card was refused, so the job stays in the review queue and the clinic has been asked for a new card." };
      case "payment-error": return { ok: false, result: "The payment could not be taken just now, so the job stays in the review queue. Try again from the review queue." };
      case "quebec": return { ok: false, result: "This job is in Quebec, which Kestrel does not post yet, so it was not approved." };
      default: return { ok: false, result: "Something went wrong, and nothing was approved. Open the review queue." };
    }
  }

  const state = await deps.claimState(action.id);
  if (!state || state.status !== "pending_review") return { ok: false, result: "This claim is no longer waiting. It may already have been handled." };
  if (!claimMayBeApprovedFromSlack(state)) return { ok: false, result: "This claim needs a look. Approve it on the claims page." };
  const claimed = await deps.approveClaim(action.id);
  if (claimed.ok) return { ok: true, result: `Claim for ${claimed.clinicName} approved by ${who} from Slack at ${time}.` };
  if (claimed.reason === "has-clinic") return { ok: false, result: "That account already owns a clinic, so this needs the claims page." };
  if (claimed.reason === "taken") return { ok: false, result: "Someone else already claimed this listing." };
  return { ok: false, result: "Something went wrong, and nothing was approved. Open the claims page." };
}

// The second half of Send back and Decline: the form has been submitted with a note. Everything is checked again, because time has passed since the
// button was pressed.
export type DecisionDeps = {
  env: Record<string, string | undefined>;
  jobWaiting: (id: string) => Promise<boolean>;
  sendBackJob: (id: string, note: string, via: string) => Promise<{ key: string }>;
  claimPending: (id: string) => Promise<boolean>;
  declineClaim: (id: string, note: string) => Promise<{ ok: true } | { ok: false; reason: string }>;
};

export async function runSlackDecision(sub: ModalSubmit, deps: DecisionDeps, now: Date = new Date()): Promise<SlackOutcome> {
  if (!isApprover(sub.userId, deps.env)) return { ok: false, result: NOT_APPROVER_MESSAGE };
  const problem = noteProblem(sub.note);
  if (problem) return { ok: false, result: problem };
  const note = sub.note.trim();
  const who = safeName(sub.userName);
  const time = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", hour: "numeric", minute: "2-digit" }).format(now);

  if (sub.kind === "send_back_job") {
    if (!(await deps.jobWaiting(sub.id))) return { ok: false, result: "This job is no longer waiting for review. It may already have been handled." };
    const result = await deps.sendBackJob(sub.id, note, `from Slack by ${who}`);
    return result.key === "rejected"
      ? { ok: true, result: `Sent back by ${who} from Slack at ${time}. The clinic has been emailed.` }
      : { ok: false, result: "Something went wrong, and nothing was sent back. Open the review queue." };
  }

  if (!(await deps.claimPending(sub.id))) return { ok: false, result: "This claim is no longer waiting. It may already have been handled." };
  const declined = await deps.declineClaim(sub.id, note);
  return declined.ok
    ? { ok: true, result: `Claim declined by ${who} from Slack at ${time}. They have been emailed.` }
    : { ok: false, result: "Something went wrong, and nothing was declined. Open the claims page." };
}
