"use client";

import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveCandidateProfile } from "@/lib/candidate-actions";
import { PROVINCES, ROLE_CATEGORIES } from "@/lib/jobs";

type Initial = { profession: string | null; licensed_provinces: string[]; years_experience: string | null; available_from: string | null; phone: string | null };

const EXPERIENCE = ["Under 1 year", "1 to 4 years", "5 to 9 years", "10 or more years"];

export default function CandidateProfileForm({ initial }: { initial: Initial | null }) {
  const { state, pending, submit } = useServerForm(saveCandidateProfile);
  const e = state.errors ?? {};
  const licensed = initial?.licensed_provinces ?? [];
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <Field id="cpf-profession" label="Your role" required error={e.profession}>
        <select id="cpf-profession" name="profession" defaultValue={initial?.profession ?? ""}>
          <option value="">Choose one</option>
          {ROLE_CATEGORIES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </Field>

      <fieldset className="row provinces">
        <legend className="lab">Licensed or registered in</legend>
        <p className="help">Tick every province or territory that applies. Leave blank if it does not apply to your role.</p>
        <div className="checkgrid">
          {PROVINCES.map((p) => (
            <label className="consent" key={p}>
              <input type="checkbox" name="licensedProvinces" value={p} defaultChecked={licensed.includes(p)} />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="pair">
        <Field id="cpf-years" label="Years of experience" error={e.yearsExperience}>
          <select id="cpf-years" name="yearsExperience" defaultValue={initial?.years_experience ?? ""}>
            <option value="">Choose one</option>
            {EXPERIENCE.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field id="cpf-available" label="Available from" error={e.availableFrom}>
          <input id="cpf-available" name="availableFrom" type="date" defaultValue={initial?.available_from ?? ""} />
        </Field>
      </div>
      <Field id="cpf-phone" label="Phone (optional)" error={e.phone} hint="Only shared with a clinic when you apply to it.">
        <input id="cpf-phone" name="phone" type="tel" autoComplete="tel" defaultValue={initial?.phone ?? ""} />
      </Field>

      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save my details"}</button>
    </form>
  );
}
