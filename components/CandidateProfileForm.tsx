"use client";

import { useEffect, useState } from "react";
import { Field, RequiredNote } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveCandidateProfile } from "@/lib/candidate-actions";
import { SOFTWARE_TAGS } from "@/lib/job-tags";
import { EMPLOYMENT_TYPES, PAY_PERIODS, PROVINCES, ROLE_CATEGORIES, employmentLabel } from "@/lib/jobs";
import { canHaveFieldRoles, openToField, otherRolesOffered } from "@/lib/role-fit";
import { BC_NOTE, DOES, DOES_LABELS, licenceProvinces, licenceRole, registerFor } from "@/lib/licence";

type Initial = {
  profession: string | null;
  licensed_provinces: string[];
  years_experience: string | null;
  available_from: string | null;
  phone: string | null;
  linkedin_url?: string | null;
  licence_province?: string | null;
  licence_number?: string | null;
  licence_does?: string[] | null;
  licence_not_yet?: boolean | null;
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

// Roles where being registered with a provincial regulator matters. The question is only asked for these.
const REGISTERED_ROLES = ["Optometrist", "Optician"];

export default function CandidateProfileForm({ initial }: { initial: Initial | null }) {
  const { state, pending, submit } = useServerForm(saveCandidateProfile);
  const e = state.errors ?? {};
  const licensed = initial?.licensed_provinces ?? [];
  // The other roles offered depend on the role chosen above, so keep it in step as it changes.
  const [profession, setProfession] = useState(initial?.profession ?? "");
  const [licProvince, setLicProvince] = useState(initial?.licence_province ?? "");
  const [licNotYet, setLicNotYet] = useState(Boolean(initial?.licence_not_yet));
  const licRole = licenceRole(profession);
  const licRegister = registerFor(licRole, licProvince);
  // The two "more" sections start closed. They open when the page is reached from "Edit what you are looking for", or when a box inside has a problem.
  const [aboutOpen, setAboutOpen] = useState(false);
  const [lookingOpen, setLookingOpen] = useState(false);
  useEffect(() => {
    if (window.location.hash === "#looking-for") setLookingOpen(true);
  }, []);
  const aboutError = Boolean(e.yearsExperience || e.availableFrom || e.phone || e.linkedin);
  const lookingError = Boolean(e.minPay || e.payPeriod);
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <RequiredNote />
      <h2 className="formh">To apply you need</h2>
      <p className="help">Your role, your town and province, and your saved resume above. Everything else on this page is optional.</p>
      <Field id="cpf-profession" label="Your role" required error={e.profession}>
        <select id="cpf-profession" name="profession" value={profession} onChange={(ev) => setProfession(ev.target.value)}>
          <option value="">Choose one</option>
          {ROLE_CATEGORIES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </Field>

      <div className="pair">
        <Field id="cpf-city" label="Your town or city" required error={e.homeCity} hint="Used to show jobs near you. Clinics never see it.">
          <input id="cpf-city" name="homeCity" type="text" autoComplete="address-level2" defaultValue={initial?.home_city ?? ""} />
        </Field>
        <Field id="cpf-home-province" label="Its province or territory" required error={e.homeProvince}>
          <select id="cpf-home-province" name="homeProvince" defaultValue={initial?.home_province ?? ""}>
            <option value="">Choose one</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>

      {profession && (
        <fieldset className="row provinces otherroles" id="other-roles">
          <legend className="lab">What else would you consider?</legend>
          <p className="help">Tick any other roles you would be happy to apply for, such as a practice or clinic manager role, or a step into a field or supplier role. A job only lets you apply when its role is yours or is ticked here. Optional.</p>
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
      )}

      {REGISTERED_ROLES.includes(profession) && (
        <fieldset className="row provinces">
          <legend className="lab">Registered in (optional)</legend>
          <p className="help">Tick every province or territory where you are registered. This is what you tell us, and Kestrel does not check it. It helps clinics see where you can work.</p>
          <div className="checkgrid">
            {PROVINCES.map((p) => (
              <label className="consent" key={p}>
                <input type="checkbox" name="licensedProvinces" value={p} defaultChecked={licensed.includes(p)} />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {licRole && (
        <fieldset className="row licencefields" id="registration">
          <legend className="lab">Your registration number{licRole === "Optician" ? " and what you are registered for" : ""}</legend>
          <p className="help">Some jobs ask for it, and clinics see it only when you apply. You enter it and Kestrel does not check it. The clinic can check it on the College&apos;s register.</p>
          <div className="pair">
            <Field id="cpf-lic-province" label="Registered by" error={e.licenceProvince} hint={licRegister ? licRegister.college : undefined}>
              <select id="cpf-lic-province" name="licenceProvince" value={licProvince} onChange={(ev) => setLicProvince(ev.target.value)} disabled={licNotYet}>
                <option value="">Choose a province or territory</option>
                {licenceProvinces(licRole).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field id="cpf-lic-number" label="Registration number" error={e.licenceNumber} hint={licProvince === "British Columbia" ? BC_NOTE : "Type it as the College shows it, with any leading zero."}>
              <input id="cpf-lic-number" name="licenceNumber" type="text" autoComplete="off" maxLength={15} defaultValue={initial?.licence_number ?? ""} disabled={licNotYet} />
            </Field>
          </div>
          {licRole === "Optician" && (
            <div className="row">
              <p className="lab">What you are registered to do</p>
              <div className="checkgrid">
                {DOES.map((d) => (
                  <label className="consent" key={d}>
                    <input type="checkbox" name="licenceDoes" value={d} defaultChecked={(initial?.licence_does ?? []).includes(d)} />
                    <span>{DOES_LABELS[d]}</span>
                  </label>
                ))}
              </div>
              <p className="help">Contact lens work is its own registration or advanced practice in several provinces.</p>
            </div>
          )}
          <label className="consent">
            <input type="checkbox" name="licenceNotYet" checked={licNotYet} onChange={(ev) => setLicNotYet(ev.target.checked)} />
            <span>I am not registered yet (a student, a new graduate, or moving to a new province)</span>
          </label>
        </fieldset>
      )}

      <details className="moreopts" id="about-you" open={aboutOpen || aboutError} onToggle={(ev) => setAboutOpen(ev.currentTarget.open)}>
        <summary>More about you</summary>
        <p className="help">Optional. Your years of experience, when you can start and your phone number and your LinkedIn profile are sent to a clinic only when you apply to it.</p>
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
        <Field id="cpf-phone" label="Phone" error={e.phone} hint="Only shared with a clinic when you apply to it.">
          <input id="cpf-phone" name="phone" type="tel" autoComplete="tel" defaultValue={initial?.phone ?? ""} />
        </Field>
        <Field id="cpf-linkedin" label="LinkedIn profile" error={e.linkedin} hint="Only shared with a clinic when you apply to it. Your own profile, like https://www.linkedin.com/in/yourname.">
          <input id="cpf-linkedin" name="linkedin" type="url" inputMode="url" autoComplete="url" placeholder="https://" defaultValue={initial?.linkedin_url ?? ""} />
        </Field>
      </details>

      <details className="moreopts" id="looking-for" open={lookingOpen || lookingError} onToggle={(ev) => setLookingOpen(ev.currentTarget.open)}>
        <summary>What you are looking for</summary>
        <p className="help">Optional and private. We use it to choose the jobs in For me and Recommended for you. Clinics never see it.</p>
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
          <p className="help">Private to you: clinics do not see it, and it is not sent with an application. We use it only to put jobs that use your software higher in your list.</p>
          <div className="checkgrid">
            {SOFTWARE_TAGS.map((name) => (
              <label className="consent" key={name}>
                <input type="checkbox" name="softwareSkills" value={name} defaultChecked={(initial?.software_skills ?? []).includes(name)} />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </details>

      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save my details"}</button>
    </form>
  );
}
