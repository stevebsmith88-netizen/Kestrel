"use client";

import { useServerForm } from "@/components/useServerForm";
import type { StripeCheck } from "@/lib/stripe-setup";
import { testStripe } from "@/lib/stripe-setup-actions";

// A box on the Payments page that says whether this copy of the site can see the Stripe keys, with a button that asks Stripe
// whether the secret key works.
export default function StripeSetupCheck({ checks }: { checks: StripeCheck[] }) {
  const { state, pending, submit } = useServerForm(testStripe);
  const trouble = checks.some((c) => !c.ok);
  return (
    <section className="card">
      <h2>Stripe setup{trouble ? ": something needs attention" : ""}</h2>
      <dl className="facts">
        {checks.map((c) => (
          <div key={c.label}><dt>{c.label}</dt><dd>{c.ok ? "OK. " : "Needs attention. "}{c.detail}</dd></div>
        ))}
      </dl>
      <form onSubmit={submit} noValidate>
        <div className="formbtns">
          <button type="submit" className="btn ghost" disabled={pending}>{pending ? "Asking Stripe" : "Test the Stripe key"}</button>
        </div>
      </form>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <p className="help">The button reads your Stripe account&apos;s settings. It charges nothing and changes nothing. Nothing here shows a key itself.</p>
    </section>
  );
}
