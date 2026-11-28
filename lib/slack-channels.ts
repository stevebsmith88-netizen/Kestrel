// Which Slack channel each kind of alert goes to (Steve, 14th November 2026; next tasks item 19). Each channel has its own optional webhook
// setting in Vercel. A channel without its own setting uses SLACK_WEBHOOK_URL, so everything keeps arriving in 1 place until Steve makes more
// channels, and he can add them 1 at a time. Kept free of the database and of the web so it can be tested.

export const SLACK_CHANNELS = {
  jobs: { env: "SLACK_WEBHOOK_URL_JOBS", suggested: "#kestrel-jobs", label: "Jobs and payments", for: "A job waiting for review, a job going live, payments and refused cards, passes and Founding clinics" },
  signups: { env: "SLACK_WEBHOOK_URL_SIGNUPS", suggested: "#kestrel-signups", label: "Sign ups", for: "New clinic and candidate accounts and waitlist sign ups" },
  support: { env: "SLACK_WEBHOOK_URL_SUPPORT", suggested: "#kestrel-support", label: "Support", for: "Help requests, feedback, reported jobs, claims, and a reminder when one has waited more than 1 business day" },
  daily: { env: "SLACK_WEBHOOK_URL_DAILY", suggested: "#kestrel-daily", label: "Daily summary", for: "The morning summary of the numbers" },
} as const;

export type SlackChannel = keyof typeof SLACK_CHANNELS;
export const SLACK_CHANNEL_NAMES = Object.keys(SLACK_CHANNELS) as SlackChannel[];

type Env = Record<string, string | undefined>;

// The webhook address for a channel: its own setting, otherwise the main one. Nothing if neither is set.
export function webhookFor(channel: SlackChannel | undefined, env: Env): string | undefined {
  const own = channel ? env[SLACK_CHANNELS[channel].env]?.trim() : "";
  return own || env.SLACK_WEBHOOK_URL?.trim() || undefined;
}

// Whether a channel has a setting of its own, for the check on Admin, Payments.
export const hasOwnWebhook = (channel: SlackChannel, env: Env) => Boolean(env[SLACK_CHANNELS[channel].env]?.trim());

// What the check on Admin, Payments shows for each channel: its own address, the main one, or nothing.
export type ChannelStatus = { channel: SlackChannel; label: string; suggested: string; env: string; use: "own" | "main" | "none"; ok: boolean; detail: string };

export function channelStatuses(env: Env, looksLikeWebhook: (url: string) => boolean): ChannelStatus[] {
  return SLACK_CHANNEL_NAMES.map((channel) => {
    const c = SLACK_CHANNELS[channel];
    const url = webhookFor(channel, env);
    const use: ChannelStatus["use"] = hasOwnWebhook(channel, env) ? "own" : url ? "main" : "none";
    if (!url) return { channel, label: c.label, suggested: c.suggested, env: c.env, use, ok: false, detail: "Not set, so these alerts are not sent." };
    if (!looksLikeWebhook(url)) return { channel, label: c.label, suggested: c.suggested, env: c.env, use, ok: false, detail: "The address does not look like a Slack incoming webhook (it should start with https://hooks.slack.com/services/)." };
    return { channel, label: c.label, suggested: c.suggested, env: c.env, use, ok: true, detail: use === "own" ? "Has its own channel address." : "Uses the main address, so it arrives with everything else." };
  });
}
