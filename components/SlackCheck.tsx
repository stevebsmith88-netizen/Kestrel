"use client";

import { useServerForm } from "@/components/useServerForm";
import { testSlack } from "@/lib/slack-actions";
import type { ChannelStatus } from "@/lib/slack-channels";

// A box on Admin, Payments: for each Slack channel, whether it has an address (never shown), and a button that sends a test message to each.
export default function SlackCheck({ channels }: { channels: ChannelStatus[] }) {
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
