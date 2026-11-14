"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Choices, Field, RequiredNote } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { readMyWebsite, saveClinic } from "@/lib/clinic-actions";
import type { SiteDetails } from "@/lib/site-details";
import { EMPLOYEE_BANDS, PROVINCES } from "@/lib/jobs";

// Clinics first, then suppliers (Steve, 14th November 2026). The answer changes the wording of the questions below it.
const EMPLOYER_TYPES = [
  { value: "independent", label: "An independent clinic" },
  { value: "corporate", label: "A corporate clinic or group" },
  { value: "supplier", label: "A supplier or manufacturer" },
] as const;

type Initial = { clinic_name: string; practice_type: string; website: string | null; province: string; city: string; about: string | null; notify_email: string; employee_band: string | null; direct_hire_confirmed_at: string | null };

// A new clinic's alert address starts as the email it signed up with, so it is not typed twice (it can be changed).
export default function ClinicProfileForm({ initial, signUpEmail = "" }: { initial: Initial | null; signUpEmail?: string }) {
  const { state, pending, submit } = useServerForm(saveClinic);
  const e = state.errors ?? {};
  const [type, setType] = useState(initial?.practice_type ?? "");
  const supplier = type === "supplier";
  const place = supplier ? "company" : "clinic";
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <RequiredNote />
      <Choices name="practiceType" label="Who are you hiring for?" options={EMPLOYER_TYPES} value={initial?.practice_type} error={e.practiceType} onChange={setType} />
      <Field id="cp-website" label="Website" error={e.website} hint="Optional. Shown on your job posts and your public page. Type it, then press Fill in from my website to save typing.">
        <input id="cp-website" name="website" type="url" placeholder="https://" defaultValue={initial?.website ?? ""} />
      </Field>
      <WebsiteFill />
      <Field id="cp-name" label={supplier ? "Company name" : "Clinic name"} required error={e.clinicName}>
        <input id="cp-name" name="clinicName" type="text" autoComplete="organization" defaultValue={initial?.clinic_name ?? ""} />
      </Field>
      <div className="pair">
        <Field id="cp-city" label={supplier ? "City of your Canadian office" : "City"} required error={e.city}>
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
      <Field id="cp-band" label={`How many people work at your ${place}? (optional)`} error={e.employeeBand} hint="Private. Only the Kestrel team sees this, and it does not change what you can post.">
        <select id="cp-band" name="employeeBand" defaultValue={initial?.employee_band ?? ""}>
          <option value="">Choose one</option>
          {EMPLOYEE_BANDS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </Field>
      <Field id="cp-about" label={`About your ${place}`} error={e.about} hint={supplier ? "Optional. What your company makes or does, where your team works, and what it is like to work with you. Shown on your job posts." : "Optional. A few lines about your team and what it is like to work with you. Shown on your job posts."}>
        <textarea id="cp-about" name="about" rows={5} defaultValue={initial?.about ?? ""} />
      </Field>
      <Field id="cp-email" label="Send new applicant alerts to" required error={e.notifyEmail} hint="Private. We never show this address on a job post. Applicants contact you through Kestrel.">
        <input id="cp-email" name="notifyEmail" type="email" autoComplete="email" defaultValue={initial?.notify_email ?? signUpEmail} />
      </Field>

      <div className={`row ${e.directHire ? "invalid" : ""}`}>
        <label className="choice agree">
          <input type="checkbox" name="directHire" value="yes" defaultChecked={Boolean(initial?.direct_hire_confirmed_at)} />
          <span>I confirm that I am hiring directly for this {place}. I am not a recruiter, staffing agency or job broker. I agree to the <Link href="/terms" target="_blank">Terms of use<span className="sr"> (opens in a new tab)</span></Link> and the <Link href="/posting-policy" target="_blank">Posting policy<span className="sr"> (opens in a new tab)</span></Link>. <span className="req" aria-hidden="true">*</span></span>
        </label>
        {e.directHire && <p className="err" role="alert">{e.directHire}</p>}
      </div>

      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message} <Link href="/clinic">Back to your dashboard</Link></p>}
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : initial ? "Save changes" : `Create my ${place} profile`}</button>
    </form>
  );
}

const FILL_FIELDS: { key: keyof SiteDetails; label: string; input: string }[] = [
  { key: "name", label: "Name", input: "cp-name" },
  { key: "city", label: "City", input: "cp-city" },
  { key: "province", label: "Province", input: "cp-province" },
  { key: "about", label: "About", input: "cp-about" },
];

// Reads the labels the clinic's own website gives search engines (no AI), shows what it found, and fills in only what is ticked.
// Nothing is saved until the form itself is saved.
function WebsiteFill() {
  const [pending, start] = useTransition();
  const [found, setFound] = useState<SiteDetails | null>(null);
  const [error, setError] = useState("");
  const [used, setUsed] = useState(false);
  const read = () =>
    start(async () => {
      setError("");
      setFound(null);
      setUsed(false);
      const typed = (document.getElementById("cp-website") as HTMLInputElement | null)?.value ?? "";
      const result = await readMyWebsite(typed);
      if (result.error) setError(result.error);
      else setFound(result.found ?? null);
    });
  const apply = (form: HTMLFormElement) => {
    for (const f of FILL_FIELDS) {
      const box = form.querySelector<HTMLInputElement>(`input[name="fill-${f.key}"]`);
      const input = document.getElementById(f.input) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (box?.checked && input && found?.[f.key]) input.value = found[f.key] as string;
    }
    setUsed(true);
  };
  return (
    <div className="row websitefill">
      <button type="button" className="btn sm ghost" onClick={read} disabled={pending}>{pending ? "Reading your website" : "Fill in from my website"}</button>
      {error && <p className="err" role="alert">{error}</p>}
      {found && (
        <div className="fillfound" role="status">
          <p>We found these on your website. Untick anything you do not want, then press Use these.</p>
          {FILL_FIELDS.filter((f) => found[f.key]).map((f) => (
            <label className="choice" key={f.key}>
              <input type="checkbox" name={`fill-${f.key}`} defaultChecked />
              <span><strong>{f.label}:</strong> {found[f.key]}</span>
            </label>
          ))}
          <button type="button" className="btn sm" onClick={(ev) => apply((ev.currentTarget.closest("form") as HTMLFormElement))}>Use these</button>
          {used && <p className="ok-msg">Filled in below. Check them, then save.</p>}
        </div>
      )}
    </div>
  );
}
