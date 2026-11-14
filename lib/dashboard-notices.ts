// The short messages shown after a dashboard action: the green or yellow box at the top of the dashboard (after a page that sends the
// person back here with ?notice=) and the small message that appears in place when a button saves without leaving the page
// (components/QuickActionForm.tsx). Kept free of imports from the app so it can be tested on its own.

export const DASHBOARD_NOTICES: Record<string, string> = {
  "profile-created": "Your clinic profile is saved. You can post your first job now.",
  "job-saved": "Your draft is saved.",
  "job-submitted": "Your job is with our team. We check every post, usually within 1 business day, and it goes live as soon as it is approved.",
  "job-closed": "The job is closed and no longer shown to candidates.",
  "location-added": "Your new location is saved, and you are working in it now. Use the Location picker to switch.",
  "team-joined": "Welcome to the team. You can now see your clinic's jobs and applicants.",
  "job-withdrawn": "The job is back in your drafts, so you can change it and send it again.",
  "job-deleted": "The job is deleted.",
  "job-delete-blocked": "That job can't be deleted because it has been live or has applications. Close it instead, so candidates keep their record.",
  "job-edited": "Your changes are with our team. The job is offline until we approve them, usually within 1 business day. Its 30 days keep running.",
  "template-saved": "Saved as a template. Start a new post from it under Post a job.",
  "template-limit": "You have 20 templates already. Delete one under Post a job, then try again.",
  "template-failed": "We couldn't save that template. Please try again.",
  "job-limit": "You have 10 open jobs already. Close or delete one, then try again.",
  "job-repost-failed": "We couldn't copy that job. Please try again.",
  "job-extended": "Done. Your job is live for another 30 days, with the same wording.",
  "job-extend-quebec": "That job is in Quebec, and Kestrel can't post jobs in Quebec yet, so it can't be extended. Quebec is planned for a later date.",
  "job-extend-blocked": "That job can't be extended right now. A live job can be extended in its last 7 days, and an ended one within 7 days of ending.",
  "job-extend-failed": "We couldn't extend the job. Please try again, or email us and we'll do it for you.",
  "job-filled": "Thank you. The job is closed and marked as filled, and anyone still waiting has been told.",
};

// What an action on the dashboard hands back when it saves without leaving the page: the key of the message to show.
// A button may also hand back its own wording and tone (the bulk buttons on the applicants page do, because their message has counts in it).
export type QuickState = { notice: string; text?: string; tone?: "ok" | "warn" } | null;

// A message that says something did not happen is shown in the yellow style, the rest in green.
export const noticeTone = (key: string): "ok" | "warn" => (/(blocked|failed|limit)$/.test(key) ? "warn" : "ok");
