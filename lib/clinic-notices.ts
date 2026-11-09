// The messages at the top of a clinic's dashboard about its jobs, worked out from the jobs themselves (no extra table): a job that was
// approved in the last 7 days, and a job sent back with something to change. Kept free of imports from the app so it can be tested on its
// own (lib/clinic-notices.test.ts). They go away by themselves after 7 days, and a clinic can also clear an approval message sooner
// (lib/notice-dismiss.ts).

export const NOTICE_DAYS = 7;
const DAY = 86_400_000;

type NoticeJob = { id: string; title: string; status: string; posted_at: string | null; expires_at: string | null; review_note: string | null };

export type JobNotice = { id: string; kind: "approved" | "needs-change"; title: string; text: string };

export function jobNotices(jobs: readonly NoticeJob[], now = new Date()): JobNotice[] {
  const out: JobNotice[] = [];
  for (const j of jobs) {
    if (j.status === "live" && j.posted_at && j.expires_at) {
      const age = now.getTime() - Date.parse(j.posted_at);
      if (age >= 0 && age <= NOTICE_DAYS * DAY && Date.parse(j.expires_at) > now.getTime()) {
        out.push({ id: j.id, kind: "approved", title: j.title, text: `${j.title} has been approved and is now live. Candidates can see it and apply.` });
      }
    } else if (j.status === "rejected" && j.review_note) {
      out.push({ id: j.id, kind: "needs-change", title: j.title, text: `${j.title} needs a change before it can go live: ${j.review_note}` });
    }
  }
  // Newest approvals first, and changes needed always before them.
  const when = (id: string) => Date.parse(jobs.find((j) => j.id === id)?.posted_at ?? "") || 0;
  return out.sort((a, b) => (a.kind === b.kind ? when(b.id) - when(a.id) : a.kind === "needs-change" ? -1 : 1));
}
