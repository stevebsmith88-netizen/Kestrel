"use client";

import Link from "next/link";
import { Choices, Field, RequiredNote } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveClinic } from "@/lib/clinic-actions";
import { PRACTICE_TYPES, PROVINCES } from "@/lib/jobs";

type Initial = { clinic_name: string; practice_type: string; website: string | null; province: string; city: string; about: string | null; notify_email: string; direct_hire_confirmed_at: string | null };

export default function ClinicProfileForm({ initial }: { initial: Initial | null }) {
  const { state, pending, submit } = useServerForm(saveClinic);
  const e = state.errors ?? {};
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <RequiredNote />
      <Field id="cp-name" label="Clinic or company name" required error={e.clinicName}>
        <input id="cp-name" name="clinicName" type="text" autoComplete="organization" defaultValue={initial?.clinic_name ?? ""} />
      </Field>
      <Choices name="practiceType" label="Type of employer" options={PRACTICE_TYPES} value={initial?.practice_type} error={e.practiceType} />
      <div className="pair">
        <Field id="cp-city" label="City" required error={e.city}>
          <input id="cp-city" name="city" type="text" autoComplete="address-level2" defaultValue={initial?.city ?? ""} />
        </Field>
        <Field id="cp-province" label="Province or territory" required error={e.province}>
          <select id="cp-province" name="province" defaultValue={initial?.province ?? ""}>
            <option value="">Choose one</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="cp-website" label="Website" error={e.website} hint="Optional. Shown on your job posts.">
        <input id="cp-website" name="website" type="url" placeholder="https://" defaultValue={initial?.website ?? ""} />
      </Field>
      <Field id="cp-about" label="About your clinic" error={e.about} hint="Optional. A few lines about your team and what it is like to work with you. Shown on your job posts.">
        <textarea id="cp-about" name="about" rows={5} defaultValue={initial?.about ?? ""} />
      </Field>
      <Field id="cp-email" label="Send new applicant alerts to" required error={e.notifyEmail} hint="Private. We never show this address on a job post. Applicants contact you through Kestrel.">
        <input id="cp-email" name="notifyEmail" type="email" autoComplete="email" defaultValue={initial?.notify_email ?? ""} />
      </Field>

      <div className={`row ${e.directHire ? "invalid" : ""}`}>
        <label className="choice agree">
          <input type="checkbox" name="directHire" value="yes" defaultChecked={Boolean(initial?.direct_hire_confirmed_at)} />
          <span>I confirm that I am hiring directly for this clinic or company. I am not a recruiter, staffing agency or job broker. I agree to the <Link href="/terms" target="_blank">Terms of use</Link> and the <Link href="/posting-policy" target="_blank">Posting policy</Link>. <span className="req" aria-hidden="true">*</span></span>
        </label>
        {e.directHire && <p className="err" role="alert">{e.directHire}</p>}
      </div>

      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message} <Link href="/clinic">Back to your dashboard</Link></p>}
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : initial ? "Save changes" : "Create my clinic profile"}</button>
    </form>
  );
}
