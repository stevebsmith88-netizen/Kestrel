"use client";

import { useState } from "react";
import Link from "next/link";
import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { startClaim } from "@/lib/claim-actions";
import { CLAIM_ROLES } from "@/lib/claims";

export default function ClaimForm({ jobId, defaultEmail, host }: { jobId: string; defaultEmail: string; host: string }) {
  const { state, pending, submit } = useServerForm(startClaim);
  const [manual, setManual] = useState(!host);
  const e = state.errors ?? {};
  if (state.message) {
    return (
      <div className="card" role="status">
        <h3>Thank you</h3>
        <p>{state.message}</p>
        <p className="help">Not there after a few minutes? Check your spam folder.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="card">
      <h3>Start your claim</h3>
      <input type="hidden" name="jobId" value={jobId} />
      <Field id="cl-email" label="Work email" required error={e.workEmail} hint={host ? `Use an address at ${host}, so we can confirm it is you.` : "We do not have the clinic's website, so a person will check your claim."}>
        <input id="cl-email" name="workEmail" type="email" autoComplete="email" defaultValue={defaultEmail} />
      </Field>
      <Field id="cl-role" label="Your role at the clinic" required error={e.role}>
        <select id="cl-role" name="role" defaultValue="">
          <option value="">Choose one</option>
          {CLAIM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      {host && (
        <label className="choice agree">
          <input type="checkbox" name="manual" value="yes" checked={manual} onChange={(ev) => setManual(ev.target.checked)} />
          <span>I do not have an email address at {host}. A person at Kestrel can check my claim instead.</span>
        </label>
      )}
      {manual && (
        <Field id="cl-note" label="How can we confirm you work there?" required error={e.note} hint="For example, your role, a phone number for the clinic's main line, or a page on the clinic's website that lists you.">
          <textarea id="cl-note" name="note" rows={4} maxLength={1000} />
        </Field>
      )}
      <div className={`row ${e.authorised ? "invalid" : ""}`}>
        <label className="choice agree">
          <input type="checkbox" name="authorised" value="yes" />
          <span>I am authorised to post on behalf of this clinic, and I agree to the <Link href="/terms" target="_blank">Terms of use<span className="sr"> (opens in a new tab)</span></Link>, the <Link href="/posting-policy" target="_blank">Posting policy<span className="sr"> (opens in a new tab)</span></Link> and the <Link href="/privacy" target="_blank">Privacy policy<span className="sr"> (opens in a new tab)</span></Link>.</span>
        </label>
        {e.authorised && <p className="err" role="alert">{e.authorised}</p>}
      </div>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      <button type="submit" className="btn block" disabled={pending}>{pending ? "Sending" : manual ? "Send my claim for checking" : "Send my verification email"}</button>
    </form>
  );
}
