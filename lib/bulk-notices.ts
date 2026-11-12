// The wording after a bulk action on the applicants page (shortlist, invite to interview, a kind no), in one place so the page, the
// buttons that save in place and the older page that reloads all say the same thing. Kept free of imports from the app so it can be
// tested on its own (lib/bulk-notices.test.ts).

// Why a bulk action could not go ahead. The page never takes this wording from the address bar.
export const BULK_PROBLEMS: Record<string, string> = {
  none: "Tick at least one applicant first.",
  message: "Write your interview invitation first. Include the date, time and how to join. Everyone you tick gets the same message.",
  brackets: "Please replace the square brackets in your message with the real details before sending.",
};

const many = (n: number, one: string, other: string) => (n === 1 ? one : other);

// After Shortlist or Invite to interview. `skipped` are applications left as they were (already at that step, or withdrawn).
export function movedText(kind: "shortlisted" | "interview", moved: number, skipped: number): string {
  const main =
    moved === 0
      ? "Nobody was moved."
      : kind === "shortlisted"
        ? `${moved} ${many(moved, "applicant is", "applicants are")} now shortlisted. No email was sent.`
        : `${moved} ${many(moved, "applicant has", "applicants have")} been invited to interview, by email and in their account.`;
  const left = skipped > 0 ? ` ${skipped} ${many(skipped, "was", "were")} left as they were, because they were already at that step or had withdrawn.` : "";
  return main + left;
}

// After a kind no.
export function declinedText(done: number): string {
  return done === 0 ? "Nobody was waiting, so no messages were sent." : `${done} ${many(done, "candidate has", "candidates have")} been told, kindly, and can see it in their account.`;
}

// Added after a bulk action when a change saved but its history line did not (audit P1-49). Empty when everything saved.
export function historyNote(failed: number): string {
  if (failed <= 0) return "";
  return failed === 1
    ? " 1 change was saved but its history line was not. We have been told and will put it right."
    : ` ${failed} changes were saved but their history lines were not. We have been told and will put it right.`;
}
