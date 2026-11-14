"use client";

import { usePathname } from "next/navigation";
import { Choices, Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { endHelpAccess, requestHelp, sendFeedback } from "@/lib/support-actions";
import { ACCESS_TEXT, FEEDBACK_KINDS, HELP_REASONS } from "@/lib/support";

function Result({ state }: { state: { error?: string; message?: string } }) {
  return (
    <>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
    </>
  );
}

// A clinic asks Kestrel for help (migration 0046). Only the owner sees the box that lets Kestrel into the account.
export function HelpRequestForm({ owner }: { owner: boolean }) {
  const { state, pending, submit } = useServerForm(requestHelp);
  const e = state.errors ?? {};
  const page = usePathname();
  if (state.message) return <Result state={state} />;
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <input type="hidden" name="page" value={page} />
      <Choices name="reason" label="What is it about?" options={HELP_REASONS} error={e.reason} />
      <Field id="hr-message" label="What is happening?" required error={e.message} hint="A few lines is plenty. Say what you tried and what you saw.">
        <textarea id="hr-message" name="message" rows={5} maxLength={2000} />
      </Field>
      {owner ? (
        <div className="row">
          <label className="consent"><input type="checkbox" name="allow" value="yes" /><span>{ACCESS_TEXT}</span></label>
          <p className="help">Optional, but it lets us fix things for you instead of explaining by email. You can take it back at any time on this page.</p>
        </div>
      ) : (
        <p className="help">We will answer you by email. If we need to change something in the clinic&apos;s account, we will ask the owner for permission.</p>
      )}
      <Result state={state} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Sending" : "Send to Kestrel"}</button>
    </form>
  );
}

export function FeedbackForm() {
  const { state, pending, submit } = useServerForm(sendFeedback);
  const e = state.errors ?? {};
  const page = usePathname();
  if (state.message) return <Result state={state} />;
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <input type="hidden" name="page" value={page} />
      <Choices name="kind" id="fb-kind" label="What is it?" options={FEEDBACK_KINDS} error={e.kind} />
      <Field id="fb-message" label="Tell us" required error={e.message} hint="For a problem: what you were doing, and what happened instead.">
        <textarea id="fb-message" name="message" rows={5} maxLength={2000} />
      </Field>
      <Result state={state} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Sending" : "Send feedback"}</button>
    </form>
  );
}

export function EndAccessForm({ id }: { id: string }) {
  const { state, pending, submit } = useServerForm(endHelpAccess);
  return (
    <form onSubmit={submit} className="teamact">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn sm ghost" disabled={pending}>{pending ? "Working" : "Take back Kestrel's access"}</button>
      <Result state={state} />
    </form>
  );
}
