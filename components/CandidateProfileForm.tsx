"use client";

import { useState } from "react";
import { Field, RequiredNote } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveCandidateProfile } from "@/lib/candidate-actions";
import { SOFTWARE_TAGS } from "@/lib/job-tags";
import { EMPLOYMENT_TYPES, PAY_PERIODS, PROVINCES, ROLE_CATEGORIES, employmentLabel } from "@/lib/jobs";
import { canHaveFieldRoles, openToField, otherRolesOffered } from "@/lib/role-fit";

type Initial = {
  profession: string | null;
  licensed_provinces: string[];
  years_experience: string | null;
  available_from: string | null;
  phone: string | null;
  home_city: string | null;
  home_province: string | null;
  pref_radius_km: number;
  pref_provinces: string[];
  pref_employment_types: string[];
  pref_other_roles: string[];
  pref_min_pay: number | string | null;
  pref_pay_period: string | null;
  pref_practice: string | null;
  software_skills: string[];
};

const RADIUS = [10, 25, 50];

const EXPERIENCE = ["Under 1 year", "1 to 4 years", "5 to 9 years", "10 or more years"];

export default function CandidateProfileForm({ initial }: { initial: Initial | null }) {
  const { state, pending, submit } = useServerForm(saveCandidateProfile);
  const e = state.errors ?? {};
  const licensed = initial?.licensed_provinces ?? [];
  // The other roles offered depend on the role chosen above, so keep it in step as it changes.
  const [profession, setProfession] = useState(initial?.profession ?? "");
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <RequiredNote />
      <Field id="cpf-profession" label="Your role" required error={e.profession}>
        <select id="cpf-profession" name="profession" value={profession} onChange={(ev) => setProfession(ev.target.value)}>
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

      <h2 className="formh" id="looking-for">What you are looking for</h2>
      <p className="help">This is private. We use it to suggest jobs on your home page. Clinics never see it.</p>

      <div className="pair">
        <Field id="cpf-city" label="Your town or city" error={e.homeCity}>
          <input id="cpf-city" name="homeCity" type="text" autoComplete="address-level2" defaultValue={initial?.home_city ?? ""} />
        </Field>
        <Field id="cpf-home-province" label="Its province or territory" error={e.homeProvince}>
          <select id="cpf-home-province" name="homeProvince" defaultValue={initial?.home_province ?? ""}>
            <option value="">Choose one</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="cpf-radius" label="How far would you travel?">
        <select id="cpf-radius" name="radius" defaultValue={String(initial?.pref_radius_km ?? 25)}>
          {RADIUS.map((r) => (
            <option key={r} value={r}>{r} km</option>
          ))}
        </select>
      </Field>

      <fieldset className="row provinces">
        <legend className="lab">Also happy to work in</legend>
        <p className="help">Tick any province or territory you would work in, anywhere in it. Handy if you plan to move.</p>
        <div className="checkgrid">
          {PROVINCES.map((p) => (
            <label className="consent" key={p}>
              <input type="checkbox" name="extraProvinces" value={p} defaultChecked={(initial?.pref_provinces ?? []).includes(p)} />
              <span>{p}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="row provinces">
        <legend className="lab">Type of work</legend>
        <p className="help">Leave all unticked for any.</p>
        <div className="checkgrid">
          {EMPLOYMENT_TYPES.map((t) => (
            <label className="consent" key={t}>
              <input type="checkbox" name="employmentTypes" value={t} defaultChecked={(initial?.pref_employment_types ?? []).includes(t)} />
              <span>{employmentLabel(t)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="pair">
        <Field id="cpf-minpay" label="Lowest pay you would accept (optional)" error={e.minPay} hint="For example 28.50 or 62,000.">
          <input id="cpf-minpay" name="minPay" type="text" inputMode="decimal" defaultValue={initial?.pref_min_pay ?? ""} />
        </Field>
        <Field id="cpf-payperiod" label="Per" error={e.payPeriod}>
          <select id="cpf-payperiod" name="payPeriod" defaultValue={initial?.pref_pay_period ?? "year"}>
            {PAY_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field id="cpf-practice" label="Kind of practice">
        <select id="cpf-practice" name="practice" defaultValue={initial?.pref_practice ?? ""}>
          <option value="">Either</option>
          <option value="independent">Independent</option>
          <option value="corporate">Corporate</option>
        </select>
      </Field>

      <fieldset className="row provinces">
        <legend className="lab">Practice software you have used</legend>
        <p className="help">Optional. Private to you: clinics do not see it, and it is not sent with an application. We use it only to put jobs that use your software higher in your recommended list.</p>
        <div className="checkgrid">
          {SOFTWARE_TAGS.map((name) => (
            <label className="consent" key={name}>
              <input type="checkbox" name="softwareSkills" value={name} defaultChecked={(initial?.software_skills ?? []).includes(name)} />
              <span>{name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="row provinces">
        <legend className="lab">Other roles you would consider</legend>
        <div className="checkgrid">
          {otherRolesOffered(profession).map((r) => (
            <label className="consent" key={r}>
              <input type="checkbox" name="otherRoles" value={r} defaultChecked={(initial?.pref_other_roles ?? []).includes(r)} />
              <span>{r}</span>
            </label>
          ))}
        </div>
        {canHaveFieldRoles(profession) && (
          <label className="consent fieldtick">
            <input type="checkbox" name="openToField" defaultChecked={openToField(initial?.pref_other_roles)} />
            <span><strong>Open to field and supplier roles.</strong> Sales, training, equipment service and account roles that travel to clinics. Jobs for these roles can then appear in your list, and you can apply for them.</span>
          </label>
        )}
      </fieldset>

      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save my details"}</button>
    </form>
  );
}
