"use client";

import { useEffect, useRef, useState } from "react";
import { Choices, Field, RequiredNote } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { buildAd } from "@/lib/ad-builder";
import { saveJob } from "@/lib/clinic-actions";
import { CLINIC_ROLES, EMPLOYMENT_TYPES, FIELD_ROLES, PAY_PERIODS, PROVINCES, WORK_ARRANGEMENTS } from "@/lib/jobs";

export type JobFormValues = {
  id?: string;
  title: string;
  role_category: string;
  employment_type: string;
  province: string;
  city: string;
  pay_period: string;
  pay_min: string;
  pay_max: string;
  is_existing_vacancy: string;
  uses_ai_screening: string;
  description: string;
  apply_method: string;
  apply_url: string;
  work_arrangement: string;
  territory: string;
  pay_extras: string;
};

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

export default function JobForm({ initial, adBuilder = false, live = false }: { initial: JobFormValues; adBuilder?: boolean; live?: boolean }) {
  const { state, pending, submit } = useServerForm(saveJob);
  const ad = useServerForm(buildAd);
  const form = useRef<HTMLFormElement>(null);
  const [description, setDescription] = useState(initial.description);
  // When the ad builder returns a draft, it goes into the ad box for the clinic to edit.
  useEffect(() => {
    if (ad.state.ad) setDescription(ad.state.ad);
  }, [ad.state.ad]);
  const [applyMethod, setApplyMethod] = useState(initial.apply_method || "kestrel");
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [arrangement, setArrangement] = useState(initial.work_arrangement || "on_site");
  const e = state.errors ?? {};
  return (
    <form ref={form} onSubmit={submit} noValidate className="panel formpanel">
      <RequiredNote />
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <h2 className="formh">The role</h2>
      <Field id="jf-title" label="Job title" required error={e.title}>
        <input id="jf-title" name="title" type="text" defaultValue={initial.title} placeholder="For example: Optician, full time" />
      </Field>
      <div className="pair">
        <Field id="jf-role" label="Role" required error={e.roleCategory}>
          <select id="jf-role" name="roleCategory" defaultValue={initial.role_category}>
            <option value="">Choose one</option>
            <optgroup label="Clinic roles">
              {CLINIC_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </optgroup>
            <optgroup label="Field and supplier roles">
              {FIELD_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </optgroup>
          </select>
        </Field>
        <Field id="jf-type" label="Employment type" required error={e.employmentType}>
          <select id="jf-type" name="employmentType" defaultValue={initial.employment_type}>
            <option value="">Choose one</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <Choices
        name="workArrangement"
        label="Where does the person work?"
        options={WORK_ARRANGEMENTS}
        value={arrangement}
        onChange={setArrangement}
        hint="Choose field based for roles that travel to clinics, such as sales, training and service."
      />
      {arrangement === "field" && (
        <Field id="jf-territory" label="Area covered" required error={e.territory} hint="For example: Southern Ontario and Ottawa, or British Columbia and Alberta. Say how much travel to expect in the ad.">
          <input id="jf-territory" name="territory" type="text" defaultValue={initial.territory} />
        </Field>
      )}
      <div className="pair">
        <Field id="jf-city" label={arrangement === "field" ? "City you are based in" : "City"} required error={e.city}>
          <input id="jf-city" name="city" type="text" defaultValue={initial.city} />
        </Field>
        <Field id="jf-province" label="Province or territory" required error={e.province}>
          <select id="jf-province" name="province" defaultValue={initial.province}>
            <option value="">Choose one</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>

      <h2 className="formh">Pay</h2>
      <p className="help formnote">A pay range is required on every post. It can be up to $50,000 wide a year, unless the top of the range is over $200,000. This follows the pay transparency rules in Ontario and British Columbia.</p>
      <Choices name="payPeriod" label="Paid" options={PAY_PERIODS} value={initial.pay_period} error={e.payPeriod} />
      <div className="pair">
        <Field id="jf-min" label="Lowest pay" required error={e.payMin}>
          <input id="jf-min" name="payMin" type="text" inputMode="decimal" defaultValue={initial.pay_min} placeholder="62,000" />
        </Field>
        <Field id="jf-max" label="Highest pay" required error={e.payMax}>
          <input id="jf-max" name="payMax" type="text" inputMode="decimal" defaultValue={initial.pay_max} placeholder="74,000" />
        </Field>
      </div>

      <Field id="jf-extras" label="Anything else that is part of the pay" error={e.payExtras} hint="Optional. For example: plus commission, a car allowance or a company vehicle. The range above should be the base pay.">
        <input id="jf-extras" name="payExtras" type="text" maxLength={300} defaultValue={initial.pay_extras} />
      </Field>

      <h2 className="formh">2 quick questions</h2>
      <Choices name="existingVacancy" label="Is this an existing vacancy?" options={YES_NO} value={initial.is_existing_vacancy} error={e.existingVacancy} hint="Choose No if you are building a pool of candidates for the future." />
      <Choices name="usesAi" label="Do you use AI to screen or select candidates?" options={YES_NO} value={initial.uses_ai_screening} error={e.usesAi} hint="Ontario requires employers to say so from 1st January 2026." />

      <h2 className="formh">The ad</h2>
      {adBuilder && (
        <div className="adbuilder">
          <Field id="jf-brief" label="Tell us about the job in a few lines" error={ad.state.errors?.brief} hint="For example: what the role involves, what you offer, who you are looking for. We will turn it into a draft ad that you can edit.">
            <textarea id="jf-brief" name="brief" rows={4} />
          </Field>
          <button type="button" className="btn sm ghost" disabled={ad.pending} onClick={() => form.current && ad.send(new FormData(form.current))}>
            {ad.pending ? "Writing your ad" : "Write my ad"}
          </button>
          {ad.state.error && <p className="err form-err" role="alert">{ad.state.error}</p>}
          {ad.state.message && <p className="ok-msg" role="status">{ad.state.message}</p>}
        </div>
      )}
      <Field id="jf-desc" label="Describe the job" required error={e.description} hint="What the role involves, what you offer and who you are looking for. Do not include email addresses or phone numbers. Please do not ask for Canadian experience.">
        <textarea id="jf-desc" name="description" rows={12} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <h2 className="formh">How people apply</h2>
      <Choices
        name="applyMethod"
        label="Applications"
        options={[
          { value: "kestrel", label: "Through Kestrel (recommended)" },
          { value: "external", label: "On our own careers page" },
        ]}
        value={applyMethod}
        onChange={setApplyMethod}
        hint="Through Kestrel keeps your email address private. Applicants write to you through us."
      />
      {applyMethod === "external" && (
        <Field id="jf-url" label="Address of your application page" required error={e.applyUrl}>
          <input id="jf-url" name="applyUrl" type="url" placeholder="https://" defaultValue={initial.apply_url} />
        </Field>
      )}

      {!live && (
        <div className="templatebox">
          <label className="choice agree">
            <input type="checkbox" name="saveTemplate" value="yes" checked={saveTemplate} onChange={(ev) => setSaveTemplate(ev.target.checked)} />
            <span>Also keep this as a template, so I can start a similar post next time. The 2 questions above are not kept, so you answer them fresh each time.</span>
          </label>
          {saveTemplate && (
            <Field id="jf-tname" label="Template name" hint="For example: Full time optician, Victoria. Using a name you already have replaces that template.">
              <input id="jf-tname" name="templateName" type="text" maxLength={80} defaultValue={initial.title} />
            </Field>
          )}
        </div>
      )}
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      <div className="formbtns">
        <button type="submit" name="intent" value="submit" className="btn" disabled={pending}>{pending ? "Saving" : live ? "Send my changes for review" : "Submit for review"}</button>
        {!live && <button type="submit" name="intent" value="draft" className="btn ghost" disabled={pending}>Save draft</button>}
      </div>
      <p className="help">Our team checks every post, usually within 1 business day, before it goes live.</p>
    </form>
  );
}
