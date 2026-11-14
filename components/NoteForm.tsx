"use client";

import { useServerForm } from "@/components/useServerForm";
import { saveApplicantNote } from "@/lib/applicant-actions";

// `addOnly` is for a "view only" team member: they read the clinic's notes and add their own, which go to the owner (migration 0045).
export default function NoteForm({ id, initial, addOnly = false }: { id: string; initial: string; addOnly?: boolean }) {
  const { state, pending, submit } = useServerForm(saveApplicantNote);
  if (addOnly) {
    return (
      <form onSubmit={submit} noValidate>
        <input type="hidden" name="id" value={id} />
        <p className="lab">Private notes</p>
        {initial ? <div className="adbody notesread">{initial}</div> : <p className="help">No notes yet.</p>}
        <label className="lab" htmlFor="nf-add">Add a note for the clinic owner</label>
        <textarea id="nf-add" name="note" rows={4} />
        <p className="help">Your note is added with your name and the date, and the owner is told. The candidate never sees it.</p>
        {state.error && <p className="err form-err" role="alert">{state.error}</p>}
        {state.message && <p className="ok-msg" role="status">{state.message}</p>}
        <button type="submit" className="btn sm ghost" disabled={pending}>{pending ? "Adding" : "Add note"}</button>
      </form>
    );
  }
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
