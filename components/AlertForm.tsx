"use client";

import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { createAlert } from "@/lib/alert-actions";
import { ALERT_FREQUENCIES, PRACTICE_TYPES, PROVINCES, ROLE_CATEGORIES } from "@/lib/jobs";

export default function AlertForm() {
  const { state, pending, submit } = useServerForm(createAlert);
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <h2 className="formh">Add an alert</h2>
      <p className="help formnote">Choose what you are looking for. Leave any of these as "any" to hear about more jobs.</p>
      <Field id="al-role" label="Role">
        <select id="al-role" name="role" defaultValue="">
          <option value="">Any role</option>
          {ROLE_CATEGORIES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Field>
      <div className="pair">
        <Field id="al-province" label="Province or territory">
          <select id="al-province" name="province" defaultValue="">
            <option value="">All of Canada</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field id="al-practice" label="Type of practice">
          <select id="al-practice" name="practice" defaultValue="">
            <option value="">Any practice</option>
            {PRACTICE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
      </div>
      <Field id="al-frequency" label="How often should we email you?" hint="One email with everything new, never one email per job. You can remove an alert at any time.">
        <select id="al-frequency" name="frequency" defaultValue="weekly">
          {ALERT_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </Field>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save this alert"}</button>
    </form>
  );
}
