"use client";

import { useServerForm } from "@/components/useServerForm";
import { saveApplicantNote } from "@/lib/applicant-actions";

export default function NoteForm({ id, initial }: { id: string; initial: string }) {
  const { state, pending, submit } = useServerForm(saveApplicantNote);
  return (
    <form onSubmit={submit} noValidate>
      <input type="hidden" name="id" value={id} />
      <label className="lab" htmlFor="nf-note">Private notes</label>
      <textarea id="nf-note" name="note" rows={5} defaultValue={initial} />
      <p className="help">Only your clinic can see these. The candidate never does.</p>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <button type="submit" className="btn sm ghost" disabled={pending}>{pending ? "Saving" : "Save note"}</button>
    </form>
  );
}
