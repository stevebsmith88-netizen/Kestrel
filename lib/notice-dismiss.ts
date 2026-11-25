// Dismissing the green "approved and now live" messages on a clinic's dashboard. Which messages a clinic has cleared is kept in a
// cookie in its own browser (a list of job ids), so there is nothing to store in the database. The messages go away by themselves
// after 7 days anyway (lib/clinic-notices.ts), so a stale cookie entry does no harm. A message that says a job needs a change is
// never hidden, because the clinic has something to do. Kept free of imports from the app so it can be tested on its own.

export const DISMISS_COOKIE = "kestrel_dismissed_notices";
export const MAX_DISMISSED = 30;
export const DISMISS_DAYS = 14;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseDismissed(value: string | undefined | null): string[] {
  return (value ?? "").split(",").map((s) => s.trim()).filter((s) => UUID.test(s));
}

// The new cookie value: what was there plus the new ids, with no repeats, keeping only the newest MAX_DISMISSED.
export function addDismissed(current: string | undefined | null, ids: readonly string[]): string {
  const merged = [...parseDismissed(current), ...ids.filter((id) => UUID.test(id))];
  return [...new Set(merged)].slice(-MAX_DISMISSED).join(",");
}

export function visibleNotices<T extends { id: string; kind: string }>(notices: readonly T[], dismissed: readonly string[]): T[] {
  const hidden = new Set(dismissed);
  return notices.filter((n) => n.kind !== "approved" || !hidden.has(n.id));
}

// The green "now live" messages as they are shown. Up to 2 are shown 1 each; more than 2 would push the dashboard off a phone screen,
// so they are folded into 1 message with a Dismiss all (P1-39).
export const FOLD_ABOVE = 2;

export function foldApprovals<T extends { id: string; title: string }>(approvals: readonly T[]): { fold: false } | { fold: true; ids: string[]; text: string } {
  if (approvals.length <= FOLD_ABOVE) return { fold: false };
  const shown = approvals.slice(0, 3).map((a) => a.title);
  const rest = approvals.length - shown.length;
  const list = rest > 0 ? `${shown.join(", ")} and ${rest} more` : `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
  return { fold: true, ids: approvals.map((a) => a.id), text: `${approvals.length} of your jobs have been approved and are now live: ${list}. Candidates can see them and apply.` };
}
