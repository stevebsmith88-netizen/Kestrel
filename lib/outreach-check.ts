// The dry run for clinic outreach: for each saved lead, does it meet every condition in docs/casl-outreach.md before anything could be sent?
// Nothing here sends anything. Kept free of app imports so it can be tested on its own (lib/outreach-check.test.ts).

export const FREE_MAIL = /(^|\.)(gmail|googlemail|hotmail|outlook|live|msn|yahoo|ymail|icloud|me|aol|proton|protonmail|shaw|rogers|bell|sympatico|telus)\.(com|ca|net|me)$/i;
export const STALE_DAYS = 90;

export type CheckInput = {
  contactEmail: string | null;
  emailSourceUrl: string | null;
  emailFoundAt: string | null;
  website: string;
  suppressed: boolean;
  onKestrel: boolean;
  hasListing: boolean;
};

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

// Every problem found, in plain words. An empty list means the lead meets every condition we can check by machine.
// A person still reads the preview before anything is ever sent.
export function outreachProblems(input: CheckInput, now = Date.now()): string[] {
  const problems: string[] = [];
  if (input.onKestrel) problems.push("This clinic is now on Kestrel with its own account, so it posts its own jobs.");
  if (!input.contactEmail) {
    problems.push("No published email address yet. Use Find a contact email on the lead.");
    return problems;
  }
  const domain = input.contactEmail.split("@")[1] ?? "";
  if (FREE_MAIL.test(domain)) problems.push("This looks like a personal address, not a business one. Only addresses published for hiring or business enquiries can be used.");
  if (!input.emailSourceUrl || !input.emailFoundAt) {
    problems.push("The page this address was published on is not recorded.");
  } else {
    const published = hostOf(input.emailSourceUrl);
    const own = hostOf(input.website);
    if (published && own && published !== own) problems.push("The address was published on a different website from the clinic's own.");
    const age = (now - new Date(input.emailFoundAt).getTime()) / 86_400_000;
    if (age > STALE_DAYS) problems.push(`The address was found more than ${STALE_DAYS} days ago. Check the page again before using it.`);
  }
  if (input.suppressed) problems.push("This address, or its whole domain, is on the do not email list.");
  if (!input.hasListing) problems.push("There is no listing for this clinic yet. The email is about a job we have listed.");
  return problems;
}
