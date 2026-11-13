"use client";

import { useState } from "react";
import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveFirstStep } from "@/lib/candidate-actions";
import { ROLE_CATEGORIES } from "@/lib/jobs";
import { canHaveFieldRoles } from "@/lib/role-fit";

// The first step after a candidate's first sign in: the role, and the field and supplier tick for roles that can have it. The career stage
// question was removed on 12th November 2026 (Steve: a resume shows it). Every question is optional, and Skip for now saves nothing but the fact that this was shown.
export default function FirstStepForm({ next }: { next?: string }) {
  const { state, pending, submit } = useServerForm(saveFirstStep);
  const e = state.errors ?? {};
  const [profession, setProfession] = useState("");
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="fs-profession" label="What is your role?" error={e.profession} hint="This sets the jobs you see first on Find jobs. You can change it any time.">
        <select id="fs-profession" name="profession" value={profession} onChange={(ev) => setProfession(ev.target.value)}>
          <option value="">Choose one</option>
          {ROLE_CATEGORIES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </Field>

      {canHaveFieldRoles(profession) && (
        <label className="consent fieldtick">
          <input type="checkbox" name="openToField" />
          <span><strong>Open to field and supplier roles.</strong> Sales, training, equipment service and account roles that travel to clinics. They can then appear in your list, and you can apply for them.</span>
        </label>
      )}

      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      <div className="formbtns">
        <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save and continue"}</button>
        <button type="submit" name="skip" value="1" className="btn ghost" disabled={pending}>Skip for now</button>
      </div>
    </form>
  );
}
