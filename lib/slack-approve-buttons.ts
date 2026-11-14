import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { paymentLine } from "@/lib/checkout-mode";
import { withExpected } from "@/lib/expected-columns";
import { REVIEW_COLUMNS, loadQueueJob } from "@/lib/review-queue";
import { approveClaimButton, approveJobButton, buttonsAllowed, claimMayBeApprovedFromSlack, jobMayBeApprovedFromSlack, type SlackButton } from "@/lib/slack-approvals";

// What a Slack alert adds so a job or a claim can be approved from it (Steve, 14th November 2026; plan in docs/plans/slack-approvals.md): a few words
// about what needs a look or what pressing the button does, and the Approve button when nothing needs a look. Nothing at all unless the live site
// has both Slack settings (SLACK_SIGNING_SECRET and SLACK_APPROVER_IDS). Best effort: a problem here never stops the alert.
export type SlackExtras = { lines: string[]; buttons: SlackButton[] };
const NONE: SlackExtras = { lines: [], buttons: [] };

export async function jobSlackExtras(db: SupabaseClient, jobId: string): Promise<SlackExtras> {
  if (!buttonsAllowed(process.env)) return NONE;
  try {
    const waiting = await loadQueueJob(db, jobId, await withExpected(REVIEW_COLUMNS));
    if (!waiting) return NONE;
    if (!jobMayBeApprovedFromSlack(waiting.flags)) {
      const n = waiting.flags.length;
      return { lines: [`${n} ${n === 1 ? "thing needs" : "things need"} a look first, so this one is approved in the review queue.`], buttons: [] };
    }
    const { data: payment } = await db.from("job_payments").select("status, amount_cents, band, failure_message").eq("job_id", jobId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    return { lines: ["Nothing flagged.", paymentLine(payment ?? null, waiting.job.role_category)], buttons: [approveJobButton(jobId)] };
  } catch (e) {
    console.error("Slack approve button not added:", e instanceof Error ? e.message : e);
    return NONE;
  }
}

export async function claimSlackExtras(db: SupabaseClient, claimId: string): Promise<SlackExtras> {
  if (!buttonsAllowed(process.env)) return NONE;
  try {
    const { data: claim } = await db.from("listing_claims").select("id, status, method").eq("id", claimId).maybeSingle();
    if (!claim) return NONE;
    if (!claimMayBeApprovedFromSlack(claim)) return { lines: ["This one needs a look first, so it is approved on the claims page."], buttons: [] };
    return { lines: ["Confirmed by email at the clinic's own website."], buttons: [approveClaimButton(claimId)] };
  } catch (e) {
    console.error("Slack approve button not added:", e instanceof Error ? e.message : e);
    return NONE;
  }
}
