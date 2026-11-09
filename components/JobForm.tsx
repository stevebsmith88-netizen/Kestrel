"use client";

import { useEffect, useRef, useState } from "react";
import { Choices, Field, RequiredNote } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { buildAd } from "@/lib/ad-builder";
import { saveJobForClinic } from "@/lib/admin-job-actions";
import { saveJob } from "@/lib/clinic-actions";
import PayBenchmark from "@/components/PayBenchmark";
import type { OwnPayStat } from "@/lib/pay-benchmark";
import { CLINIC_ROLES, EMPLOYMENT_TYPES, employmentLabel, FIELD_ROLES, PROVINCES, QUEBEC, QUEBEC_JOB_MESSAGE, WORK_ARRANGEMENTS } from "@/lib/jobs";
import { OPTOMETRIST_ONLY_BASES, OPTOMETRIST_ROLE, PAY_BASES, PERCENT_OF } from "@/lib/job-pay";
import { TAG_GROUPS } from "@/lib/job-tags";

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
  pay_percent_min: string;
  pay_percent_max: string;
  pay_percent_of: string;
  pay_percent_too: string; // "yes" when a daily minimum also pays a percentage
  tags_software: string[];
  tags_equipment: string[];
  tags_specialties: string[];
};

// Money boxes for each way of working out pay: what they are called and what the grey example shows.
const MONEY_BOXES: Record<string, { low: string; high: string; lowEg: string; highEg: string; hint?: string }> = {
  year: { low: "Lowest pay", high: "Highest pay", lowEg: "62,000", highEg: "74,000" },
  hour: { low: "Lowest pay", high: "Highest pay", lowEg: "24", highEg: "28" },
  day: { low: "Lowest daily rate", high: "Highest daily rate", lowEg: "900", highEg: "1,100", hint: "What you pay for a full day worked. A range can be up to $200 a day wide. If you pay one set amount, type it in both boxes." },
  day_minimum: { low: "Lowest daily minimum", high: "Highest daily minimum", lowEg: "600", highEg: "800", hint: "The amount you guarantee for a day worked. A range can be up to $200 a day wide. If you guarantee one set amount, type it in both boxes." },
};

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

// employerId is set only when an admin posts for a clinic. The form then saves through the admin action, and skips the clinic only parts.
export default function JobForm({ initial, adBuilder = false, live = false, employerId, ownPay = [] }: { initial: JobFormValues; adBuilder?: boolean; live?: boolean; employerId?: string; ownPay?: readonly OwnPayStat[] }) {
  const { state, pending, submit } = useServerForm(employerId ? saveJobForClinic : saveJob);
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
  // Followed so the pay guide can compare the range as it is typed. The guide never changes what is saved.
  const [role, setRole] = useState(initial.role_category);
  const [province, setProvince] = useState(initial.province);
  const [payBasis, setPayBasis] = useState(initial.pay_period);
  const [payMin, setPayMin] = useState(initial.pay_min);
  const [payMax, setPayMax] = useState(initial.pay_max);
  const [alsoPercent, setAlsoPercent] = useState(initial.pay_percent_too === "yes");
  // Daily rates, daily minimums and percentages are for optometrist roles. For any other role the choice falls back to a salary.
  const isOptometrist = role === OPTOMETRIST_ROLE;
  const bases = isOptometrist ? PAY_BASES : PAY_BASES.filter((b) => !OPTOMETRIST_ONLY_BASES.includes(b.value));
  const basis = bases.some((b) => b.value === payBasis) ? payBasis : "year";
  const money = MONEY_BOXES[basis];
  const showPercent = basis === "percent" || (basis === "day_minimum" && alsoPercent);
  const e = state.errors ?? {};
  return (
    <form ref={form} onSubmit={submit} noValidate className="panel formpanel">
      <RequiredNote />
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {employerId && <input type="hidden" name="employerId" value={employerId} />}

      <h2 className="formh">The role</h2>
      <Field id="jf-title" label="Job title" required error={e.title}>
        <input id="jf-title" name="title" type="text" defaultValue={initial.title} placeholder="For example: Optician, full time" />
      </Field>
      <div className="pair">
        <Field id="jf-role" label="Role" required error={e.roleCategory}>
          <select id="jf-role" name="roleCategory" value={role} onChange={(ev) => setRole(ev.target.value)}>
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
              <option key={t} value={t}>{employmentLabel(t)}</option>
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
        <Field id="jf-province" label="Province or territory" required error={e.province} hint={province === QUEBEC ? QUEBEC_JOB_MESSAGE : undefined}>
          <select id="jf-province" name="province" value={province} onChange={(ev) => setProvince(ev.target.value)}>
            <option value="">Choose one</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>

      <h2 className="formh">Pay</h2>
      <p className="help formnote">A pay range is required on every post, however the pay is worked out. Words such as &quot;negotiable&quot; or &quot;discussed at interview&quot; are not accepted on their own. Enter the range you expect to pay, even if the final offer may be higher. Pay is shown to everyone. This follows the pay transparency rules in Ontario and British Columbia.</p>
      <Choices key={bases.length} name="payPeriod" label="How is the pay worked out?" options={bases} value={basis} onChange={setPayBasis} error={e.payPeriod} hint={isOptometrist ? undefined : "Daily rates and percentages are available when the role is Optometrist."} />
      {money && (
        <>
          <div className="pair">
            <Field id="jf-min" label={money.low} required error={e.payMin} hint={money.hint}>
              <input id="jf-min" name="payMin" type="text" inputMode="decimal" value={payMin} onChange={(ev) => setPayMin(ev.target.value)} placeholder={money.lowEg} />
            </Field>
            <Field id="jf-max" label={money.high} required error={e.payMax}>
              <input id="jf-max" name="payMax" type="text" inputMode="decimal" value={payMax} onChange={(ev) => setPayMax(ev.target.value)} placeholder={money.highEg} />
            </Field>
          </div>
          {basis === "day_minimum" && (
            <label className="choice agree">
              <input type="checkbox" name="payPercentToo" value="yes" checked={alsoPercent} onChange={(ev) => setAlsoPercent(ev.target.checked)} />
              <span>The optometrist is also paid a percentage when it comes to more than the daily minimum</span>
            </label>
          )}
        </>
      )}
      {showPercent && (
        <>
          <div className="pair">
            <Field id="jf-pmin" label="Lowest percentage" required error={e.payPercentMin} hint="A range can be up to 10 points wide, for example 28% to 38%.">
              <input id="jf-pmin" name="payPercentMin" type="text" inputMode="decimal" defaultValue={initial.pay_percent_min} placeholder="28" />
            </Field>
            <Field id="jf-pmax" label="Highest percentage" required error={e.payPercentMax}>
              <input id="jf-pmax" name="payPercentMax" type="text" inputMode="decimal" defaultValue={initial.pay_percent_max} placeholder="35" />
            </Field>
          </div>
          <Field id="jf-pof" label="The percentage is of" required error={e.payPercentOf} hint="Production is the value of the work done. Collections is the money actually received. Billings is the amount invoiced.">
            <select id="jf-pof" name="payPercentOf" defaultValue={initial.pay_percent_of || "production"}>
              {PERCENT_OF.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
        </>
      )}
      {(basis === "year" || basis === "hour") && <PayBenchmark role={role} province={province} period={basis} min={payMin} max={payMax} own={ownPay} />}

      <Field id="jf-extras" label="Bonus, commission or anything else that is part of the pay" error={e.payExtras} hint="Optional. For example: a yearly bonus, plus commission, a car allowance or a company vehicle. The range above should be the base pay.">
        <input id="jf-extras" name="payExtras" type="text" maxLength={300} defaultValue={initial.pay_extras} />
      </Field>

      <h2 className="formh">Tools and specialties</h2>
      <p className="help formnote">Optional. Tick what the person will work with. Candidates can search by these.</p>
      {TAG_GROUPS.map((g) => (
        <fieldset className="row tagrow" key={g.key}>
          <legend className="lab">{g.label}</legend>
          <div className="choices">
            {g.list.map((name) => (
              <label className="choice" key={name}>
                <input type="checkbox" name={g.field} value={name} defaultChecked={initial[`tags_${g.key}` as "tags_software" | "tags_equipment" | "tags_specialties"].includes(name)} />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

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

      {!live && !employerId && (
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
      <p className="help">{employerId ? "This goes to the review queue, where you approve it. A draft stays with the clinic to finish." : "Our team checks every post, usually within 1 business day, before it goes live."}</p>
    </form>
  );
}
