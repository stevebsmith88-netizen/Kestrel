// The rules for approving from Slack, kept free of the web and the database so they can be tested (plan: docs/plans/slack-approvals.md).

type Env = Record<string, string | undefined>;

export const APPROVE_JOB = "kestrel_approve_job";
export const APPROVE_CLAIM = "kestrel_approve_claim";
export const SEND_BACK_JOB = "kestrel_sendback_job";
export const DECLINE_CLAIM = "kestrel_decline_claim";
// A button on a Slack alert. Approve asks "Are you sure?" first. Send back and Decline open a form for the note instead, so they ask nothing first.
export type SlackButton = {
  actionId: typeof APPROVE_JOB | typeof APPROVE_CLAIM | typeof SEND_BACK_JOB | typeof DECLINE_CLAIM;
  value: string;
  label: string;
  style?: "primary" | "danger";
  confirmTitle?: string;
  confirmText?: string;
};

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
export type ApprovalStatus = { ready: boolean; demo: boolean; signingSecretSet: boolean; approversGiven: number; approversValid: number; botTokenSet: boolean; sendBackReady: boolean; problems: string[] };

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
  const botTokenSet = Boolean(env.SLACK_BOT_TOKEN?.trim());
  return { ready: problems.length === 0, demo, signingSecretSet, approversGiven: given.length, approversValid, botTokenSet, sendBackReady: problems.length === 0 && botTokenSet, problems };
}

// Send back and Decline open a form in Slack, which needs a Slack bot token (SLACK_BOT_TOKEN) as well.
export const modalButtonsAllowed = (env: Env) => buttonsAllowed(env) && Boolean(env.SLACK_BOT_TOKEN?.trim());

export type SlackAction = { kind: "approve_job" | "approve_claim" | "send_back_job" | "decline_claim"; id: string; userId: string; userName: string; responseUrl: string; triggerId: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Reads the JSON Slack sends when a button is pressed. Anything that is not a press of one of our 2 buttons on a real id gives nothing.
export function parseSlackAction(payload: unknown): SlackAction | null {
  const p = payload as { type?: string; trigger_id?: string; user?: { id?: string; name?: string; username?: string }; actions?: { action_id?: string; value?: string }[]; response_url?: string } | null;
  if (!p || p.type !== "block_actions" || !p.user?.id || !p.response_url) return null;
  const a = p.actions?.[0];
  if (!a?.value || !UUID.test(a.value)) return null;
  const kind = a.action_id === APPROVE_JOB ? "approve_job" : a.action_id === APPROVE_CLAIM ? "approve_claim" : a.action_id === SEND_BACK_JOB ? "send_back_job" : a.action_id === DECLINE_CLAIM ? "decline_claim" : null;
  if (!kind) return null;
  return { kind, id: a.value, userId: p.user.id, userName: p.user.name || p.user.username || "someone", responseUrl: p.response_url, triggerId: p.trigger_id ?? "" };
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

export const sendBackButton = (jobId: string): SlackButton => ({ actionId: SEND_BACK_JOB, value: jobId, label: "Send back" });
export const declineClaimButton = (claimId: string): SlackButton => ({ actionId: DECLINE_CLAIM, value: claimId, label: "Decline", style: "danger" });

// The note a clinic or claimant is sent with a Send back or a Decline. It must say something useful, so it is at least 10 characters.
export const NOTE_MIN = 10;
export const NOTE_MAX = 1000;
export function noteProblem(note: string): string | null {
  const n = note.trim();
  if (n.length < NOTE_MIN) return `Tell them what to change, in at least ${NOTE_MIN} characters.`;
  if (n.length > NOTE_MAX) return `Keep it under ${NOTE_MAX} characters.`;
  return null;
}

// What comes back when the form is submitted in Slack: which form it was, for which job or claim, the note, and who sent it.
export type ModalSubmit = { kind: "send_back_job" | "decline_claim"; id: string; note: string; userId: string; userName: string; responseUrl: string; original: string };

export function parseModalSubmit(payload: unknown): ModalSubmit | null {
  const p = payload as { type?: string; user?: { id?: string; name?: string; username?: string }; view?: { callback_id?: string; private_metadata?: string; state?: { values?: Record<string, Record<string, { value?: string | null }>> } } } | null;
  if (!p || p.type !== "view_submission" || !p.user?.id || !p.view) return null;
  const kind = p.view.callback_id === SEND_BACK_JOB ? "send_back_job" : p.view.callback_id === DECLINE_CLAIM ? "decline_claim" : null;
  if (!kind) return null;
  let meta: { id?: string; responseUrl?: string; original?: string } = {};
  try {
    meta = JSON.parse(p.view.private_metadata ?? "{}");
  } catch {
    return null;
  }
  if (!meta.id || !UUID.test(meta.id)) return null;
  const note = String(p.view.state?.values?.note?.note_input?.value ?? "");
  return { kind, id: meta.id, note, userId: p.user.id, userName: p.user.name || p.user.username || "someone", responseUrl: String(meta.responseUrl ?? ""), original: String(meta.original ?? "") };
}
