"use client";

import { useActionState, startTransition } from "react";
import { useServerForm } from "@/components/useServerForm";
import { applyResumeAnswers, readMyResume, type ReaderState } from "@/lib/resume-actions";

// "Fill in from my resume": press a button, check what was found, keep what is right. No AI, and nothing is saved until the answers are ticked and saved.
export default function ResumeReader() {
  const [read, run, reading] = useActionState<ReaderState>(async () => readMyResume(), {});
  const { state: saved, pending: saving, submit } = useServerForm<ReaderState>(applyResumeAnswers);
  const rows = read.rows ?? [];
  return (
    <section className="card" aria-labelledby="rr-h">
      <h2 id="rr-h">Fill in from my resume</h2>
      <p className="help">Kestrel reads your saved resume on its own server and suggests answers for your profile. No AI is used, nothing is sent to another service, and the text is not kept. You choose which answers to keep.</p>
      {rows.length === 0 && !saved.message && (
        <>
          {read.error && <p className="err form-err" role="alert">{read.error}</p>}
          <button type="button" className="btn sm" disabled={reading} onClick={() => startTransition(() => run())}>{reading ? "Reading" : "Read my resume"}</button>
        </>
      )}
      {rows.length > 0 && !saved.message && (
        <form onSubmit={submit} noValidate className="stackform">
          <p><strong>Here is what we found.</strong> Untick anything that is wrong.</p>
          <ul className="readerlist">
            {rows.map((r) => (
              <li key={r.key}>
                <label className="consent">
                  <input type="checkbox" name="use" value={r.key} defaultChecked />
                  <span><strong>{r.label}:</strong> {r.display}<br /><span className="help">{r.why}</span></span>
                </label>
              </li>
            ))}
          </ul>
          {saved.error && <p className="err form-err" role="alert">{saved.error}</p>}
          <div className="formbtns"><button type="submit" className="btn sm" disabled={saving}>{saving ? "Saving" : "Save the ticked answers"}</button></div>
        </form>
      )}
      {saved.message && <p className="ok-msg" role="status">{saved.message}</p>}
    </section>
  );
}
