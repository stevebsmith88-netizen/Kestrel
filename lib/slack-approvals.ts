// The rules for approving from Slack, kept free of the web and the database so they can be tested (plan: docs/plans/slack-approvals.md).

type Env = Record<string, string | undefined>;

export const APPROVE_JOB = "kestrel_approve_job";
export const APPROVE_CLAIM = "kestrel_approve_claim";
export type SlackButton = { actionId: typeof APPROVE_JOB | typeof APPROVE_CLAIM; value: string; label: string; confirmTitle: string; confirmText: string };

// The Slack member IDs allowed to press a button, from SLACK_APPROVER_IDS (separated by commas). Anyone else is refused.
export function parseApprovers(value: string | undefined): Set<string> {
  return new Set((value ?? "").split(/[,\s]+/).map((v) => v.trim()).filter((v) => /^[UW][A-Z0-9]{5,}$/.test(v)));
}

// Buttons go only on the live site, and only once both settings exist. The demo shares the Slack app, which has 1 address for its buttons, so a
// demo alert's button would reach the live site.
export function buttonsAllowed(env: Env): boolean {
  return env.DEMO_MODE !== "yes" && Boolean(env.SLACK_SIGNING_SECRET?.trim()) && parseApprovers(env.SLACK_APPROVER_IDS).size > 0;
}

export type SlackAction = { kind: "approve_job" | "approve_claim"; id: string; userId: string; userName: string; responseUrl: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reads the JSON Slack sends when a button is pressed. Anything that is not a press of one of our 2 buttons on a real id gives nothing.
export function parseSlackAction(payload: unknown): SlackAction | null {
  const p = payload as { type?: string; user?: { id?: string; name?: string; username?: string }; actions?: { action_id?: string; value?: string }[]; response_url?: string } | null;
  if (!p || p.type !== "block_actions" || !p.user?.id || !p.response_url) return null;
  const a = p.actions?.[0];
  if (!a?.value || !UUID.test(a.value)) return null;
  const kind = a.action_id === APPROVE_JOB ? "approve_job" : a.action_id === APPROVE_CLAIM ? "approve_claim" : null;
  if (!kind) return null;
  return { kind, id: a.value, userId: p.user.id, userName: p.user.name || p.user.username || "someone", responseUrl: p.response_url };
}

// A job gets an Approve button only when nothing about it needs a look. Anything flagged goes to the review queue instead.
export const jobMayBeApprovedFromSlack = (flags: string[]) => flags.length === 0;

// Only a claim confirmed by email at the clinic's own website may be approved from Slack.
export const claimMayBeApprovedFromSlack = (claim: { method: string | null; status: string }) => claim.method === "email" && claim.status === "pending_review";

export const approveJobButton = (jobId: string): SlackButton => ({
  actionId: APPROVE_JOB, value: jobId, label: "Approve and publish",
  confirmTitle: "Approve this job?", confirmText: "It goes live now. If payments are on, the clinic's saved card is charged.",
});
export const approveClaimButton = (claimId: string): SlackButton => ({
  actionId: APPROVE_CLAIM, value: claimId, label: "Approve this claim",
  confirmTitle: "Approve this claim?", confirmText: "The clinic account becomes the owner of the profile and its listings.",
});
