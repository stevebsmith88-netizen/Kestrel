import "server-only";
import { HIREABLE } from "@/lib/applications";

// "Still in play" (Steve, 13th November 2026): an application that is sent, viewed, shortlisted, at interview or at offer, on a job the
// clinic still has. While a candidate has one, their name cannot change (lib/name-change.ts), so a clinic always recognises who it is
// talking to. Once every application is closed (not selected, role filled, kept, withdrawn, hired, or the clinic left), it can change again.
type CountDb = {
  from(table: string): {
    select(columns: string, opts: { count: "exact"; head: true }): {
      eq(column: string, value: string): { in(column: string, values: readonly string[]): { not(column: string, op: string, value: null): PromiseLike<{ count: number | null; error: unknown }> } };
    };
  };
};

export async function hasApplicationInPlay(admin: CountDb | null, userId: string): Promise<boolean> {
  if (!admin) return false;
  const { count, error } = await admin.from("applications").select("id", { count: "exact", head: true }).eq("candidate_id", userId).in("status", HIREABLE).not("job_id", "is", null);
  if (error) {
    console.error("Checking for live applications failed:", error);
    return false;
  }
  return (count ?? 0) > 0;
}
