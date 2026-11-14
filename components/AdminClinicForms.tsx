"use client";

import { Choices, Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { adminCancelInvite, adminMakeOwner, adminRemoveMember, adminResendInvite, adminSaveClinic, type AdminClinicState } from "@/lib/admin-clinic-actions";
import { PRACTICE_TYPES, PROVINCES } from "@/lib/jobs";

function Result({ state }: { state: AdminClinicState }) {
  return (
    <>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}{state.code && <> New code: <strong className="teamcode">{state.code}</strong></>}</p>}
    </>
  );
}

const Reason = ({ id }: { id: string }) => (
  <div className="row">
    <label className="lab" htmlFor={id}>Why (saved in the record, and shown to the owner)</label>
    <input id={id} name="reason" type="text" maxLength={500} placeholder="What you are doing for them" />
  </div>
);

type Clinic = { id: string; clinic_name: string; practice_type: string; website: string | null; province: string; city: string; about: string | null };

export function AdminProfileForm({ clinic }: { clinic: Clinic }) {
  const { state, pending, submit } = useServerForm<AdminClinicState>(adminSaveClinic);
  const e = state.errors ?? {};
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <input type="hidden" name="employerId" value={clinic.id} />
      <Field id="ac-name" label="Name" required error={e.clinicName}><input id="ac-name" name="clinicName" type="text" defaultValue={clinic.clinic_name} /></Field>
      <Choices name="practiceType" label="Type of employer" options={PRACTICE_TYPES} value={clinic.practice_type} error={e.practiceType} />
      <div className="pair">
        <Field id="ac-city" label="City" required error={e.city}><input id="ac-city" name="city" type="text" defaultValue={clinic.city} /></Field>
        <Field id="ac-prov" label="Province or territory" required error={e.province}>
          <select id="ac-prov" name="province" defaultValue={clinic.province}>{PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
        </Field>
      </div>
      <Field id="ac-web" label="Website" error={e.website}><input id="ac-web" name="website" type="url" defaultValue={clinic.website ?? ""} /></Field>
      <Field id="ac-about" label="About" error={e.about}><textarea id="ac-about" name="about" rows={5} defaultValue={clinic.about ?? ""} /></Field>
      <Reason id="ac-reason" />
      <Result state={state} />
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save the profile"}</button>
    </form>
  );
}

function Act({ action, employerId, fields, label, warn }: { action: (p: AdminClinicState, f: FormData) => Promise<AdminClinicState>; employerId: string; fields: Record<string, string>; label: string; warn?: boolean }) {
  const { state, pending, submit } = useServerForm<AdminClinicState>(action);
  const key = Object.values(fields).join("-");
  return (
    <details className="teammore">
      <summary>{label}</summary>
      <form onSubmit={submit} noValidate className="adminact">
        <input type="hidden" name="employerId" value={employerId} />
        {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <Reason id={`r-${label.replace(/\W+/g, "")}-${key}`} />
        <Result state={state} />
        <button type="submit" className={warn ? "btn sm ghost" : "btn sm"} disabled={pending}>{pending ? "Working" : label}</button>
      </form>
    </details>
  );
}

export const AdminResend = ({ employerId, id }: { employerId: string; id: string }) => <Act action={adminResendInvite} employerId={employerId} fields={{ id }} label="Send again" />;
export const AdminCancel = ({ employerId, id }: { employerId: string; id: string }) => <Act action={adminCancelInvite} employerId={employerId} fields={{ id }} label="Cancel invitation" warn />;
export const AdminRemove = ({ employerId, userId }: { employerId: string; userId: string }) => <Act action={adminRemoveMember} employerId={employerId} fields={{ userId }} label="Remove from team" warn />;
export const AdminMakeOwner = ({ employerId, userId }: { employerId: string; userId: string }) => <Act action={adminMakeOwner} employerId={employerId} fields={{ userId }} label="Make owner" />;
