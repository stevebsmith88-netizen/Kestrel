import "server-only";
import { SITE_URL } from "@/lib/email-layout";
import { buttonsAllowed, type SlackButton } from "@/lib/slack-approvals";
import { alertMessage } from "@/lib/slack-blocks";
import { webhookFor, type SlackChannel } from "@/lib/slack-channels";
import { formatAlert, isSlackWebhook, siteLabel } from "@/lib/slack-text";

// Posts a short alert to Steve's private Slack channel (SLACK_WEBHOOK_URL, a secret kept only in Vercel). Best effort: it never throws and never
// stops what caused it, and it does nothing until the setting exists. Only a real hooks.slack.com address is used. The address is never logged.
// Alerts carry counts, clinic names, job titles and towns only, never a person's name, email, phone number or resume (lib/slack-text.ts).
// `link` is a page on this site (a path such as /admin/review) and the words for it, so the alert ends with a link to go and do the next thing.
// `channel` says which Slack channel it belongs in (lib/slack-channels.ts). A channel with no address of its own uses SLACK_WEBHOOK_URL.
export async function notifySlack(title: string, lines: string[] = [], link?: { path: string; text: string }, channel?: SlackChannel, buttons: SlackButton[] = []): Promise<boolean> {
  const url = webhookFor(channel, process.env);
  if (!url) return false;
  if (!isSlackWebhook(url)) {
    console.error("A Slack address is not a Slack incoming webhook address, so no alert was sent.");
    return false;
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertMessage(formatAlert(siteLabel(process.env), title, lines, link ? { url: `${SITE_URL}${link.path}`, text: link.text } : undefined), buttonsAllowed(process.env) ? buttons : [])),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) console.error("Slack alert not sent: Slack answered", response.status);
    return response.ok;
  } catch (e) {
    console.error("Slack alert not sent:", e instanceof Error ? e.name : "error");
    return false;
  }
}
