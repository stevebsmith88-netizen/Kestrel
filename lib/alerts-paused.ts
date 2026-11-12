// The note on the job alerts page for a person who unsubscribed from Kestrel's emails (audit P1-51). Unsubscribing stops every
// marketing email, job alerts included, because that is the safe reading of Canada's anti spam law. The alerts are kept, so turning
// emails back on in Email choices starts them again. Kept free of app imports so it can be tested (lib/alerts-paused.test.ts).

export const ALERTS_PAUSED_NOTE =
  "You have unsubscribed from Kestrel's emails, so we are not emailing your job alerts at the moment. Your alerts are kept. To get them again, tick the box for news and job alerts under Email choices on your account page.";

export const alertsPaused = (profile: { unsubscribed_at?: string | null } | null | undefined) => Boolean(profile?.unsubscribed_at);
