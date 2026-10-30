"use client";

import { useState } from "react";
import { Choices, Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveJob } from "@/lib/clinic-actions";
import { EMPLOYMENT_TYPES, PAY_PERIODS, PROVINCES, ROLE_CATEGORIES } from "@/lib/jobs";

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
};

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

export default function JobForm({ initial }: { initial: JobFormValues }) {
  const { state, pending, submit } = useServerForm(saveJob);
  const [applyMethod, setApplyMethod] = useState(initial.apply_method || "kestrel");
  const e = state.errors ?? {};
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <h2 className="formh">The role</h2>
      <Field id="jf-title" label="Job title" required error={e.title}>
        <input id="jf-title" name="title" type="text" defaultValue={initial.title} placeholder="For example: Optician, full time" />
      </Field>
      <div className="pair">
        <Field id="jf-role" label="Role" required error={e.roleCategory}>
          <select id="jf-role" name="roleCategory" defaultValue={initial.role_category}>
            <option value="">Choose one</option>
            {ROLE_CATEGORIES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
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
      <div className="pair">
        <Field id="jf-city" label="City" required error={e.city}>
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

      <h2 className="formh">Two quick questions</h2>
      <Choices name="existingVacancy" label="Is this an existing vacancy?" options={YES_NO} value={initial.is_existing_vacancy} error={e.existingVacancy} hint="Choose No if you are building a pool of candidates for the future." />
      <Choices name="usesAi" label="Do you use AI to screen or select candidates?" options={YES_NO} value={initial.uses_ai_screening} error={e.usesAi} hint="Ontario requires employers to say so from 1st January 2026." />

      <h2 className="formh">The ad</h2>
      <Field id="jf-desc" label="Describe the job" required error={e.description} hint="What the role involves, what you offer and who you are looking for. Do not include email addresses or phone numbers. Please do not ask for Canadian experience.">
        <textarea id="jf-desc" name="description" rows={12} defaultValue={initial.description} />
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

      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      <div className="formbtns">
        <button type="submit" name="intent" value="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Submit for review"}</button>
        <button type="submit" name="intent" value="draft" className="btn ghost" disabled={pending}>Save draft</button>
      </div>
      <p className="help">Our team checks every post, usually within 1 business day, before it goes live.</p>
    </form>
  );
}
