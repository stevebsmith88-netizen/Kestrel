// The ad as it appears in the Slack alert for a job waiting for review (Steve, 15th November 2026), so a job can be judged without opening the site.
// Pure, so it can be tested (lib/slack-ad.test.ts). Email addresses, phone numbers and web addresses are cut out, since Slack's servers are outside
// Canada and a clinic sometimes types its own contact details into the ad. They stay in the review queue. Slack allows about 3,000 characters in
// one block, so a long ad is shortened with a pointer to the queue.

import { payText, type PayFields } from "./job-pay.ts";

export const AD_MAX = 1800;
const REMOVED = "[contact details removed]";

// Takes out anything that could reach a person or a page outside Kestrel.
export function stripContacts(text: string): string {
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REMOVED)
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, REMOVED)
    .replace(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, REMOVED)
    .replace(/(?:\[contact details removed\][\s,;]*){2,}/g, `${REMOVED} `);
}

export type SlackAdJob = PayFields & {
  headline?: string | null;
  title: string;
  role_category: string;
  employment_type: string;
  city: string;
  province: string;
  is_existing_vacancy: boolean | null;
  uses_ai_screening: boolean | null;
  description: string;
};

const yn = (v: boolean | null) => (v === true ? "yes" : v === false ? "no" : "not answered");

export function adLines(job: SlackAdJob): string[] {
  const text = stripContacts((job.description ?? "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim());
  const cut = text.length > AD_MAX ? `${text.slice(0, AD_MAX).replace(/\s+\S*$/, "")} ... (the ad continues, read the rest in the review queue)` : text;
  return [
    ...(job.headline ? [stripContacts(job.headline)] : []),
    `${job.role_category}, ${job.employment_type}, ${job.city}, ${job.province}`,
    `Pay: ${payText(job)}`,
    `Existing vacancy: ${yn(job.is_existing_vacancy)}. Uses AI to screen candidates: ${yn(job.uses_ai_screening)}.`,
    ...(cut ? ["The ad:", cut] : ["The ad is empty."]),
  ];
}
