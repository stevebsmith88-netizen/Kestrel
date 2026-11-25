"use server";

import { requireRole } from "@/lib/auth";
import type { JobFormState } from "@/lib/jobs";
import { notifySlack } from "@/lib/notify-slack";
import { SLACK_CHANNELS, channelStatuses } from "@/lib/slack-channels";
import { isSlackWebhook } from "@/lib/slack-text";

// The Send a test message button on Admin, Payments (admin only). Sends 1 short message to every channel that has an address, each saying which
// channel it is for, so Steve can see every alert land where it should.
export async function testSlack(_prev: JobFormState, _form: FormData): Promise<JobFormState> {
  await requireRole("admin");
  const ready = channelStatuses(process.env, isSlackWebhook).filter((c) => c.ok);
  if (ready.length === 0) return { error: "No Slack address is set up yet. Add SLACK_WEBHOOK_URL in Vercel first." };
  let sent = 0;
  for (const c of ready) {
    const ok = await notifySlack(`Test message: ${SLACK_CHANNELS[c.channel].label}`, [`Sent from Admin, Payments. This is the ${SLACK_CHANNELS[c.channel].label} channel (${SLACK_CHANNELS[c.channel].suggested}).`], undefined, c.channel);
    if (ok) sent += 1;
  }
  return sent === ready.length
    ? { message: `Sent ${sent} test ${sent === 1 ? "message" : "messages"}. Look in Slack: each one names the channel it is for.` }
    : { error: `${sent} of ${ready.length} test messages were accepted. Slack did not accept the rest. An address may have been deleted or replaced in Slack. Make a new webhook there and paste it into Vercel.` };
}
