"use client";

import { useState } from "react";
import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveFirstStep } from "@/lib/candidate-actions";
import { CAREER_STAGES } from "@/lib/career-stage";
import { ROLE_CATEGORIES } from "@/lib/jobs";
import { canHaveFieldRoles } from "@/lib/role-fit";

// The first step after a candidate's first sign in. Every question is optional, and Skip for now saves nothing but the fact that this was shown.
export default function FirstStepForm() {
  const { state, pending, submit } = useServerForm(saveFirstStep);
  const e = state.errors ?? {};
  const [profession, setProfession] = useState("");
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
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

      <fieldset className="row provinces">
        <legend className="lab">Where are you in eye care?</legend>
        <p className="help">Optional and private. Clinics do not see it, and it does not change which jobs you can apply for.</p>
        {CAREER_STAGES.map((s) => (
          <label className="consent" key={s.value}>
            <input type="radio" name="careerStage" value={s.value} />
            <span>{s.label}</span>
          </label>
        ))}
      </fieldset>

      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      <div className="formbtns">
        <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save and continue"}</button>
        <button type="submit" name="skip" value="1" className="btn ghost" disabled={pending}>Skip for now</button>
      </div>
    </form>
  );
}
