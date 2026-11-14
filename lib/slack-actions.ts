"use server";

import { requireRole } from "@/lib/auth";
import type { JobFormState } from "@/lib/jobs";
import { notifySlack } from "@/lib/notify-slack";
import { slackStatus } from "@/lib/slack-text";

// The Send a test message button on Admin, Payments (admin only). Sends 1 short message to the Slack channel, so Steve can see it arrive.
export async function testSlack(_prev: JobFormState, _form: FormData): Promise<JobFormState> {
  await requireRole("admin");
  const status = slackStatus(process.env.SLACK_WEBHOOK_URL);
  if (!status.ok) return { error: status.detail };
  const sent = await notifySlack("Test message", ["Sent from Admin, Payments. If you can read this, Slack alerts are working."]);
  return sent ? { message: "Sent. Look in your Slack channel for the test message." } : { error: "Slack did not accept the message. The address may have been deleted or replaced in Slack. Make a new webhook, put it in Vercel and redeploy." };
}
