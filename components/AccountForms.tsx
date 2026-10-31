"use client";

import { FREQUENCIES, RESPONSE_NOTE, type Frequency } from "@/lib/clinic-emails";
import Link from "next/link";
import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { requestEmailChange, savePreferences, updateName } from "@/lib/account-settings-actions";
import { MARKETING_CONSENT_TEXT } from "@/lib/auth-copy";

export function NameForm({ first, last }: { first: string; last: string }) {
  const { state, pending, submit } = useServerForm(updateName);
  const e = state.errors ?? {};
  return (
    <form onSubmit={submit} noValidate className="stackform">
      <div className="pair">
        <Field id="ac-first" label="First name" required error={e.firstName}>
          <input id="ac-first" name="firstName" type="text" autoComplete="given-name" defaultValue={first} />
        </Field>
        <Field id="ac-last" label="Last name" error={e.lastName}>
          <input id="ac-last" name="lastName" type="text" autoComplete="family-name" defaultValue={last} />
        </Field>
      </div>
      {state.error && !state.errors?.firstName && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <div><button type="submit" className="btn sm" disabled={pending}>{pending ? "Saving" : "Save my name"}</button></div>
    </form>
  );
}

export function EmailForm({ current, hasPassword = true }: { current: string; hasPassword?: boolean }) {
  const { state, pending, submit } = useServerForm(requestEmailChange);
  const e = state.errors ?? {};
  if (!hasPassword) return <p className="help">You sign in with Google, using <strong>{current}</strong>. Your email address comes from your Google account, so it is changed there.</p>;
  if (state.message) return <p className="ok-msg" role="status">{state.message}</p>;
  return (
    <form onSubmit={submit} noValidate className="stackform">
      <p className="help">You sign in with <strong>{current}</strong>. To use a different address, enter it here. We will email a link to both addresses, and the change only happens once you have opened both.</p>
      <Field id="ac-email" label="New email address" required error={e.email}>
        <input id="ac-email" name="email" type="email" autoComplete="email" />
      </Field>
      <Field id="ac-pass" label="Your password" required error={e.password} hint="So we know it is you.">
        <input id="ac-pass" name="password" type="password" autoComplete="current-password" />
      </Field>
      {state.error && !state.errors && <p className="err form-err" role="alert">{state.error}</p>}
      <div><button type="submit" className="btn sm ghost" disabled={pending}>{pending ? "Sending" : "Change my email address"}</button></div>
    </form>
  );
}

export type Prefs = { news: boolean; applicationUpdates: boolean; applicantEmails: Frequency; reminders: boolean };

export function PreferencesForm({ role, prefs, hasClinic }: { role: "candidate" | "clinic"; prefs: Prefs; hasClinic: boolean }) {
  const { state, pending, submit } = useServerForm(savePreferences);
  return (
    <form onSubmit={submit} className="stackform">
      <label className="consent">
        <input type="checkbox" name="news" value="yes" defaultChecked={prefs.news} />
        <span>{MARKETING_CONSENT_TEXT}{role === "candidate" && " Turning this off also stops your job alert emails, but keeps your alerts so you can turn them back on."}</span>
      </label>
      {role === "candidate" ? (
        <label className="consent">
          <input type="checkbox" name="applicationUpdates" value="yes" defaultChecked={prefs.applicationUpdates} />
          <span>Email me when a clinic updates one of my applications. You can always see the latest in My applications.</span>
        </label>
      ) : hasClinic ? (
        <>
          <fieldset className="radiogroup">
            <legend>How often should we email you about new applicants?</legend>
            {FREQUENCIES.map((f) => (
              <label key={f.value} className="consent">
                <input type="radio" name="applicantEmails" value={f.value} defaultChecked={prefs.applicantEmails === f.value} />
                <span>{f.label}</span>
              </label>
            ))}
            <p className="help">Whatever you choose, new applicants always appear in your dashboard. {RESPONSE_NOTE}</p>
          </fieldset>
          <label className="consent">
            <input type="checkbox" name="reminders" value="yes" defaultChecked={prefs.reminders} />
            <span>Remind me when applications have waited 2 weeks without being opened.</span>
          </label>
        </>
      ) : (
        <p className="help">Once you have set up your clinic, you can also choose whether to be emailed about new applicants. <Link href="/clinic/profile">Set up your clinic</Link></p>
      )}
      <p className="help">We always email you about your security (password resets and changing your email) and about your account, such as a job we have had to take down.</p>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <div><button type="submit" className="btn sm" disabled={pending}>{pending ? "Saving" : "Save my email choices"}</button></div>
    </form>
  );
}
