"use client";

import { useServerForm } from "@/components/useServerForm";
import { syncStripeCatalog } from "@/lib/stripe-catalog-actions";
import type { CatalogRow } from "@/lib/stripe-catalog-sync";
import { stateText } from "@/lib/stripe-catalog";

const money = (cents: number) => "$" + (cents / 100).toLocaleString("en-CA");

// Admin, Payments: the products and prices Stripe should hold, whether each is there, and a button that adds what is missing.
export default function StripeCatalogPanel({ rows, coupon, endsOn, canSync, readError }: { rows: CatalogRow[]; coupon: boolean; endsOn: string; canSync: boolean; readError?: string }) {
  const { state, pending, submit } = useServerForm(syncStripeCatalog);
  const allOk = rows.every((r) => r.state === "ok") && coupon;
  return (
    <section className="card">
      <h2>Products and prices{allOk ? "" : ": not finished"}</h2>
      <p className="help">These come from the prices in the site&apos;s code, so Stripe and the site cannot disagree. Prices are before HST.</p>
      {readError && <p className="err form-err" role="alert">Could not read Stripe: {readError}</p>}
      <dl className="facts">
        {rows.map((r) => (
          <div key={r.label}><dt>{r.label}</dt><dd>{money(r.cents)}{r.every ? ` a ${r.every}` : ""}. {stateText(r.state)}</dd></div>
        ))}
        <div><dt>Free launch coupon</dt><dd>{coupon ? "In Stripe" : "Not in Stripe yet"}. 100% off single posts only, never a pass. Ends {endsOn} (kept in the site&apos;s code, so it can change without touching Stripe).</dd></div>
      </dl>
      {canSync ? (
        <form onSubmit={submit} noValidate>
          <div className="formbtns">
            <button type="submit" className="btn ghost" disabled={pending}>{pending ? "Working" : "Create or update in Stripe"}</button>
          </div>
        </form>
      ) : (
        <p className="help">The button appears once a test key is in place.</p>
      )}
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <p className="help">The button only adds what is missing, so it is safe to press again. It never deletes anything and works only in test mode.</p>
    </section>
  );
}
