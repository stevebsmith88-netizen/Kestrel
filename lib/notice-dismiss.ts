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
