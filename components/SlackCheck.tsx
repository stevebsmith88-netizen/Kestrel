"use client";

import { useServerForm } from "@/components/useServerForm";
import { testSlack } from "@/lib/slack-actions";

// A box on Admin, Payments: whether the Slack address is set (never shown), and a button that sends a test message to the channel.
export default function SlackCheck({ ok, detail }: { ok: boolean; detail: string }) {
  const { state, pending, submit } = useServerForm(testSlack);
  return (
    <section className="card">
      <h2>Slack alerts{ok ? "" : ": not set up yet"}</h2>
      <dl className="facts">
        <div><dt>SLACK_WEBHOOK_URL (private channel address)</dt><dd>{ok ? "OK. " : "Needs attention. "}{detail}</dd></div>
      </dl>
      <form onSubmit={submit} noValidate>
        <div className="formbtns">
          <button type="submit" className="btn ghost" disabled={pending || !ok}>{pending ? "Sending" : "Send a test message"}</button>
        </div>
      </form>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <p className="help">Alerts go to your Slack channel for jobs waiting for review, jobs going live, payments, refused cards, new accounts and waitlist sign ups, plus a daily summary. They carry counts, clinic names and job titles, never an applicant&apos;s details.</p>
    </section>
  );
}
