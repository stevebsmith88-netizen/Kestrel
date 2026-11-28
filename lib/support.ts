// Help requests and feedback (Steve, 14th November 2026; migration 0046). Wording and rules shared by the form, the server and the admin
// pages. Kept free of app imports so it can be tested on its own.

export const SUPPORT_EMAIL = "support@eyecarejobs.ca";
export const ACCESS_DAYS = 7;
export const REQUESTS_PER_DAY = 5;

export const HELP_REASONS = [
  { value: "team", label: "Setting up my team or an invitation" },
  { value: "posting", label: "Posting or changing a job" },
  { value: "profile", label: "My clinic profile or public page" },
  { value: "applicants", label: "Applicants or messages to them" },
  { value: "account", label: "Signing in or my account" },
  { value: "other", label: "Something else" },
] as const;

export const FEEDBACK_KINDS = [
  { value: "bug", label: "Something is not working" },
  { value: "idea", label: "An idea or a feature request" },
  { value: "other", label: "Something else" },
] as const;

// What a clinic agrees to when it lets Kestrel into its account. Saved word for word with the request, so keep it identical to the page.
export const ACCESS_TEXT = `I allow the Kestrel team to see and change my clinic's account for the next ${ACCESS_DAYS} days, or until this request is closed, to help with it. They can see the clinic profile, the team's names, email addresses and access, open invitations, the job posts and how many people applied to each. They cannot see applicants' resumes, cover letters or our private notes.`;

export const reasonLabel = (value: string | null) => HELP_REASONS.find((r) => r.value === value)?.label ?? FEEDBACK_KINDS.find((k) => k.value === value)?.label ?? "Other";
export const kindLabel = (kind: string) => (kind === "help" ? "Help request" : FEEDBACK_KINDS.find((k) => k.value === kind)?.label ?? "Feedback");

export const accessEnds = (from: Date) => new Date(from.getTime() + ACCESS_DAYS * 24 * 60 * 60 * 1000);

// Whether Kestrel may work in a clinic's account right now: an open help request whose permission has not run out.
export type AccessRow = { status: string; access_until: string | null };
export const accessOpen = (row: AccessRow | null | undefined, now = new Date()) =>
  Boolean(row && row.status === "open" && row.access_until && new Date(row.access_until).getTime() > now.getTime());
