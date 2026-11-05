"use client";

import { useServerForm } from "@/components/useServerForm";
import { testClaude } from "@/lib/setup-actions";
import type { Check } from "@/lib/setup-check";

// A box on the Found listings page that says what this copy of the site can see, with buttons that test the connection to Claude.
export default function SetupCheck({ checks }: { checks: Check[] }) {
  const { state, pending, submit } = useServerForm(testClaude);
  const trouble = checks.some((c) => !c.ok);
  return (
    <details className="card" open={trouble || undefined}>
      <summary><strong>Setup check</strong>{trouble ? " (something needs attention)" : ""}</summary>
      <dl className="facts">
        {checks.map((c) => (
          <div key={c.label}><dt>{c.label}</dt><dd>{c.ok ? "OK. " : "Needs attention. "}{c.detail}</dd></div>
        ))}
      </dl>
      <form onSubmit={submit} noValidate>
        <div className="formbtns">
          <button type="submit" name="which" value="basic" className="btn ghost" disabled={pending}>{pending ? "Testing" : "Test Claude"}</button>
          <button type="submit" name="which" value="search" className="btn ghost" disabled={pending}>Test web search</button>
        </div>
      </form>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <p className="help">The buttons send 1 tiny request to Claude each. The ad builder, the page reader and the province search all use the same key. Nothing here shows the key itself.</p>
    </details>
  );
}
