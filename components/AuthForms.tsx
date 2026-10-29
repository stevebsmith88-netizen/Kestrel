"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { forgotPassword, resetPassword, signIn, signUp } from "@/lib/auth-actions";
import { ACCOUNT_TYPES, MARKETING_CONSENT_TEXT, MIN_PASSWORD, type FormState } from "@/lib/auth-copy";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

// Sends the form without React's automatic reset, so a wrong password does not
// clear what the person typed.
function useAuthForm(action: Action) {
  const [state, run, pending] = useActionState(action, {} as FormState);
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => run(data));
  };
  return { state, pending, submit };
}

// A password box with an eye to show or hide what has been typed.
function PasswordField({ id, name, label, autoComplete, hint, minLength }: { id: string; name: string; label: string; autoComplete: string; hint?: string; minLength?: number }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="row">
      <label className="lab" htmlFor={id}>{label}</label>
      <div className="pw">
        <input id={id} name={name} type={shown ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} required aria-describedby={hint ? `${id}-hint` : undefined} />
        <button type="button" className="pw-toggle" onClick={() => setShown(!shown)} aria-pressed={shown} aria-label={shown ? "Hide password" : "Show password"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {shown && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
      {hint && <p className="help" id={`${id}-hint`}>{hint}</p>}
    </div>
  );
}

function Problem({ text }: { text?: string }) {
  return text ? (
    <p className="err form-err" role="alert">
      {text}
    </p>
  ) : null;
}

// Replaces the whole form once it has worked, with its own heading.
function Done({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="auth-done" tabIndex={-1} ref={(el) => el?.focus()}>
      <h1>{title}</h1>
      {children}
      <p className="alt"><Link href="/sign-in">Back to sign in</Link></p>
    </div>
  );
}

export function SignInForm({ notice }: { notice?: string }) {
  const { state, pending, submit } = useAuthForm(signIn);
  return (
    <form onSubmit={submit} noValidate>
      {notice && <p className="err form-err" role="alert">{notice}</p>}
      <div className="row">
        <label className="lab" htmlFor="si-email">Email</label>
        <input id="si-email" name="email" type="email" autoComplete="email" required />
      </div>
      <PasswordField id="si-password" name="password" label="Password" autoComplete="current-password" />
      <Problem text={state.error} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Signing in" : "Sign in"}</button>
      <p className="alt"><Link href="/forgot-password">Forgot your password?</Link></p>
      <p className="alt">New to Kestrel? <Link href="/sign-up">Create an account</Link></p>
    </form>
  );
}

export function SignUpForm() {
  const { state, pending, submit } = useAuthForm(signUp);
  if (state.message) {
    return (
      <Done title="Thanks for creating your account">
        <p className="auth-intro">
          We have sent a confirmation link to <strong>{state.email}</strong>. Open it to confirm your address, then sign in.
        </p>
        <p className="help">It can take a minute to arrive. If you don&apos;t see it, check your spam or junk folder.</p>
      </Done>
    );
  }
  return (
    <form onSubmit={submit} noValidate>
      <h1>Create your account</h1>
      <p className="auth-intro">
        Free to join. We are still building Kestrel, so jobs and posting are not open yet. Create your account now, and tick the second box below to hear the moment they are.
      </p>
      <div className="row">
        <p className="lab" id="su-type">I am</p>
        <div className="choices" role="radiogroup" aria-labelledby="su-type">
          {ACCOUNT_TYPES.map((a) => (
            <label className="choice" key={a.value}>
              <input type="radio" name="accountType" value={a.value} defaultChecked={a.value === "candidate"} />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="pair">
        <div className="row">
          <label className="lab" htmlFor="su-first">First name</label>
          <input id="su-first" name="firstName" type="text" autoComplete="given-name" required />
        </div>
        <div className="row">
          <label className="lab" htmlFor="su-last">Last name</label>
          <input id="su-last" name="lastName" type="text" autoComplete="family-name" required />
        </div>
      </div>
      <div className="row">
        <label className="lab" htmlFor="su-email">Email</label>
        <input id="su-email" name="email" type="email" autoComplete="email" required />
      </div>
      <PasswordField id="su-password" name="password" label="Password" autoComplete="new-password" minLength={MIN_PASSWORD} hint={`At least ${MIN_PASSWORD} characters. A few words you will remember work well.`} />
      <div className="row">
        <label className="consent">
          <input name="agree" type="checkbox" />
          <span>
            I agree to the <Link href="/privacy" target="_blank">privacy policy</Link>.
          </span>
        </label>
      </div>
      <div className="row">
        <label className="consent">
          <input name="marketing" type="checkbox" />
          <span>{MARKETING_CONSENT_TEXT}</span>
        </label>
      </div>
      <Problem text={state.error} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Creating your account" : "Create my account"}</button>
      <p className="alt">Already have an account? <Link href="/sign-in">Sign in</Link></p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { state, pending, submit } = useAuthForm(forgotPassword);
  if (state.message) {
    return (
      <Done title="Check your email">
        <p className="auth-intro">{state.message}</p>
        <p className="help">It can take a minute to arrive. If you don&apos;t see it, check your spam or junk folder.</p>
      </Done>
    );
  }
  return (
    <form onSubmit={submit} noValidate>
      <h1>Reset your password</h1>
      <p className="auth-intro">Enter your email and we will send you a link.</p>
      <div className="row">
        <label className="lab" htmlFor="fp-email">Email</label>
        <input id="fp-email" name="email" type="email" autoComplete="email" required />
      </div>
      <Problem text={state.error} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Sending" : "Send me a link"}</button>
      <p className="alt"><Link href="/sign-in">Back to sign in</Link></p>
    </form>
  );
}

export function ResetPasswordForm() {
  const { state, pending, submit } = useAuthForm(resetPassword);
  return (
    <form onSubmit={submit} noValidate>
      <PasswordField id="rp-password" name="password" label="New password" autoComplete="new-password" minLength={MIN_PASSWORD} hint={`At least ${MIN_PASSWORD} characters.`} />
      <PasswordField id="rp-again" name="again" label="Type it again" autoComplete="new-password" />
      <Problem text={state.error} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save my new password"}</button>
    </form>
  );
}
