"use client";

import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveLetterTemplate } from "@/lib/letter-actions";

export default function LetterForm() {
  const { state, pending, submit } = useServerForm(saveLetterTemplate);
  const e = state.errors ?? {};
  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <h2 className="formh">Add a letter</h2>
      <p className="help formnote">Write a letter you can start from. Always change it so it speaks to the clinic you are writing to.</p>
      <Field id="lt-name" label="Name" required error={e.name} hint="For example: Optician, independent clinic. Using a name you already have replaces that letter.">
        <input id="lt-name" name="name" type="text" maxLength={80} />
      </Field>
      <Field id="lt-body" label="Letter" required error={e.body}>
        <textarea id="lt-body" name="body" rows={10} maxLength={5000} placeholder={"Dear [clinic] team,\n\nI am writing because..."} />
      </Field>
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Save this letter"}</button>
    </form>
  );
}
