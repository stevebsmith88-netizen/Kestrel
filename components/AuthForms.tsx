"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
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

function Problem({ text }: { text?: string }) {
  return text ? (
    <p className="err form-err" role="alert">
      {text}
    </p>
  ) : null;
}

function Done({ title, text }: { title: string; text: string }) {
  return (
    <div className="thanks" tabIndex={-1} ref={(el) => el?.focus()}>
      <h3>{title}</h3>
      <p>{text}</p>
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
      <div className="row">
        <label className="lab" htmlFor="si-password">Password</label>
        <input id="si-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Problem text={state.error} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Signing in" : "Sign in"}</button>
      <p className="alt"><Link href="/forgot-password">Forgot your password?</Link></p>
      <p className="alt">New to Kestrel? <Link href="/sign-up">Create an account</Link></p>
    </form>
  );
}

export function SignUpForm() {
  const { state, pending, submit } = useAuthForm(signUp);
  if (state.message) return <Done title="Check your email" text={state.message} />;
  return (
    <form onSubmit={submit} noValidate>
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
      <div className="row">
        <label className="lab" htmlFor="su-name">Your name</label>
        <input id="su-name" name="fullName" type="text" autoComplete="name" required />
      </div>
      <div className="row">
        <label className="lab" htmlFor="su-email">Email</label>
        <input id="su-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="row">
        <label className="lab" htmlFor="su-password">Password</label>
        <input id="su-password" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required aria-describedby="su-hint" />
        <p className="help" id="su-hint">At least {MIN_PASSWORD} characters. A few words you will remember work well.</p>
      </div>
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
  if (state.message) return <Done title="Check your email" text={state.message} />;
  return (
    <form onSubmit={submit} noValidate>
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
      <div className="row">
        <label className="lab" htmlFor="rp-password">New password</label>
        <input id="rp-password" name="password" type="password" autoComplete="new-password" minLength={MIN_PASSWORD} required />
        <p className="help">At least {MIN_PASSWORD} characters.</p>
      </div>
      <div className="row">
        <label className="lab" htmlFor="rp-again">Type it again</label>
        <input id="rp-again" name="again" type="password" autoComplete="new-password" required />
      </div>
      <Problem text={state.error} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save my new password"}</button>
    </form>
  );
}
