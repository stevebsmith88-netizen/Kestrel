"use client";

import { useServerForm } from "@/components/useServerForm";
import { testSlack } from "@/lib/slack-actions";
import type { ApprovalStatus } from "@/lib/slack-approvals";
import type { ChannelStatus } from "@/lib/slack-channels";

// A box on Admin, Payments: for each Slack channel, whether it has an address (never shown), and a button that sends a test message to each.
export default function SlackCheck({ channels, approvals }: { channels: ChannelStatus[]; approvals: ApprovalStatus }) {
  const { state, pending, submit } = useServerForm(testSlack);
  const anyOk = channels.some((c) => c.ok);
  return (
    <section className="card">
      <h2>Slack alerts{anyOk ? "" : ": not set up yet"}</h2>
      <dl className="facts">
        {channels.map((c) => (
          <div key={c.channel}><dt>{c.label} ({c.suggested})<br /><span className="help">{c.env}</span></dt><dd>{c.ok ? "OK. " : "Needs attention. "}{c.detail}</dd></div>
        ))}
      </dl>
      <h3 className="subhead">Approve buttons</h3>
      <dl className="facts">
        <div><dt>SLACK_SIGNING_SECRET<br /><span className="help">Lets the site trust a press from Slack</span></dt><dd>{approvals.signingSecretSet ? "OK. It is set." : "Needs attention. Not set."}</dd></div>
        <div><dt>SLACK_APPROVER_IDS<br /><span className="help">Who may press Approve</span></dt><dd>{approvals.approversValid > 0 ? `OK. ${approvals.approversValid} ${approvals.approversValid === 1 ? "person" : "people"} on the list.` : approvals.approversGiven > 0 ? "Needs attention. Set, but not in the right shape." : "Needs attention. Not set."}</dd></div>
        <div><dt>Will buttons appear on alerts?</dt><dd>{approvals.ready ? "Yes, on a job with nothing flagged and a claim confirmed by email." : "No."}</dd></div>
      </dl>
      {approvals.problems.map((p) => <p key={p} className="err form-err" role="status">{p}</p>)}
      <form onSubmit={submit} noValidate>
        <div className="formbtns">
          <button type="submit" className="btn ghost" disabled={pending || !anyOk}>{pending ? "Sending" : "Send a test message to each channel"}</button>
        </div>
      </form>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <p className="help">A channel with no address of its own uses SLACK_WEBHOOK_URL, so everything keeps arriving in 1 place until you make more channels. Alerts carry counts, clinic names and job titles, never an applicant&apos;s name, email or resume.</p>
    </section>
  );
}
