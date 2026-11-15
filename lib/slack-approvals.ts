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

// What the check on Admin, Payments shows about the Approve buttons: whether each setting is there and in the right shape, and so whether a button will
// appear. It never shows a value, only whether it is set and how many member IDs were understood.
export type ApprovalStatus = { ready: boolean; demo: boolean; signingSecretSet: boolean; approversGiven: number; approversValid: number; problems: string[] };

export function approvalStatus(env: Env): ApprovalStatus {
  const demo = env.DEMO_MODE === "yes";
  const signingSecretSet = Boolean(env.SLACK_SIGNING_SECRET?.trim());
  const given = (env.SLACK_APPROVER_IDS ?? "").split(/[,\s]+/).map((v) => v.trim()).filter(Boolean);
  const approversValid = parseApprovers(env.SLACK_APPROVER_IDS).size;
  const problems: string[] = [];
  if (demo) problems.push("This is the demo site, which never gets Approve buttons. Check the live site instead.");
  if (!signingSecretSet) problems.push("SLACK_SIGNING_SECRET is not set on this site. Add it in Vercel (Production), then redeploy without the build cache.");
  if (given.length === 0) problems.push("SLACK_APPROVER_IDS is not set on this site. Add your Slack member ID in Vercel (Production), then redeploy without the build cache.");
  else if (approversValid === 0) problems.push(`SLACK_APPROVER_IDS has ${given.length} ${given.length === 1 ? "entry" : "entries"} but none looks like a Slack member ID. A member ID starts with a capital U or W and has only capital letters and numbers, for example U0ABC123.`);
  return { ready: problems.length === 0, demo, signingSecretSet, approversGiven: given.length, approversValid, problems };
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
