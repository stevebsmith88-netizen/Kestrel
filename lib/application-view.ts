// How one application looks to each reader. The candidate never sees "Shortlisted" (it is the clinic's own working list), so their copy
// shows it as "Viewed" and drops a message left over from an older shortlist. The clinic sees the real status and the real history.
// Kept free of app imports so it can be tested on its own (lib/application-view.test.ts).
import { candidateHistory, candidateStatus } from "./applications.ts";

type WithStatus = { status: string; clinic_message: string | null };
export type HistoryEvent = { status: string; note: string | null; created_at: string };

export function viewForCandidate<T extends WithStatus>(a: T): T {
  return a.status === "shortlisted" ? { ...a, status: candidateStatus(a.status), clinic_message: null } : a;
}

export function viewApplication<T extends WithStatus>(row: T, events: readonly HistoryEvent[], audience: "candidate" | "clinic"): { application: T; history: HistoryEvent[] } {
  if (audience === "clinic") return { application: row, history: [...events] };
  return { application: viewForCandidate(row), history: candidateHistory(events) };
}
