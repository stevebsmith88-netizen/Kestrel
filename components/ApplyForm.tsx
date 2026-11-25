"use client";

import { useState } from "react";
import { useServerForm } from "@/components/useServerForm";
import { applyToJob } from "@/lib/candidate-actions";
import { saveApplicationDraft } from "@/lib/letter-actions";
import Link from "next/link";
import { Field } from "@/components/Field";
import { wordCount } from "@/lib/applications";

export type LetterTemplate = { id: string; name: string; body: string };

// The apply form, kept short so Send sits near the top on a phone (Steve, 13th November 2026, from docs/audit/CLICK-COUNT-2026-11-12.md).
// There is no second question when there is no note: the encouragement to write one stays on the page. Saved letters, drafts and
// "keep this letter" are folded under 1 line.
export default function ApplyForm({ jobId, clinicName, draft = "", draftSavedAt = "", letters = [] }: { jobId: string; clinicName: string; draft?: string; draftSavedAt?: string; letters?: LetterTemplate[] }) {
  const { state, pending, submit } = useServerForm(applyToJob);
  const saver = useServerForm(saveApplicationDraft);
  const [letter, setLetter] = useState(draft);
  const [saveLetter, setSaveLetter] = useState(false);
  const [chosen, setChosen] = useState("");
  const words = wordCount(letter);

  return (
    <form onSubmit={submit} noValidate className="stackform">
      <input type="hidden" name="jobId" value={jobId} />
      <section className="card" aria-labelledby="cl-h">
        <h2 id="cl-h">Add a cover note (optional)</h2>
        <p className="help"><strong>We recommend adding one.</strong> Clinics tend to read the personal ones first: a few honest lines about why {clinicName} and what you would bring.</p>
        <label className="lab" htmlFor="af-letter">Your cover note</label>
        <textarea id="af-letter" name="coverLetter" rows={6} value={letter} onChange={(e) => setLetter(e.target.value)} placeholder={`Dear ${clinicName} team,\n\nI am writing because...`} />
        <div className="letterfoot">
          <span className="help">About 100 to 200 words works well. Write it fresh for each job.</span>
          <span className="help">{words} {words === 1 ? "word" : "words"}</span>
        </div>
        <details className="lettertools" open={Boolean(draftSavedAt)}>
          <summary>Saved letters and drafts</summary>
          {letters.length > 0 && (
            <div className="letterpick">
              <label className="lab" htmlFor="af-pick">Start from one of your saved letters</label>
              <div className="pickrow">
                <select id="af-pick" value={chosen} onChange={(ev) => setChosen(ev.target.value)}>
                  <option value="">Choose a letter</option>
                  {letters.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <button type="button" className="btn sm ghost" disabled={!chosen} onClick={() => { const l = letters.find((x) => x.id === chosen); if (l) setLetter(l.body); }}>Use it</button>
              </div>
              <p className="help">Change it so it speaks to {clinicName}. Clinics can tell when a letter has been sent to 20 places.</p>
            </div>
          )}
          <div className="draftrow">
            <button
              type="button"
              className="btn sm ghost"
              disabled={saver.pending}
              onClick={() => { const data = new FormData(); data.set("jobId", jobId); data.set("coverLetter", letter); saver.send(data); }}
            >
              {saver.pending ? "Saving" : "Save as a draft"}
            </button>
            <span className="help" aria-live="polite">
              {saver.state.message ?? saver.state.error ?? (draftSavedAt ? `Draft last saved ${draftSavedAt}.` : "Not ready? Save it and come back later.")}
            </span>
          </div>
          <label className="consent">
            <input type="checkbox" name="saveLetter" value="yes" checked={saveLetter} onChange={(ev) => setSaveLetter(ev.target.checked)} />
            <span>Keep this letter to start future applications from. You can keep up to 5. <Link href="/candidate/letters" target="_blank">My saved letters<span className="sr"> (opens in a new tab)</span></Link></span>
          </label>
          {saveLetter && (
            <Field id="af-lname" label="Name for this letter" hint="For example: Optician, independent clinic.">
              <input id="af-lname" name="letterName" type="text" maxLength={80} />
            </Field>
          )}
        </details>
      </section>

      <section className="card">
        <label className="consent">
          <input name="agree" type="checkbox" />
          <span>I agree that {clinicName} can see this application, my resume and my details. Kestrel keeps them private from everyone else.</span>
        </label>
        {state.errors?.agree && <p className="err" role="alert">{state.errors.agree}</p>}
        <label className="consent">
          <input name="keepDetails" type="checkbox" />
          <span>Optional: if this role is filled, let {clinicName} keep my details for future roles. I can ask them to delete them at any time.</span>
        </label>
        {state.error && <p className="err form-err" role="alert">{state.error}</p>}
        <div className="formbtns">
          <button type="submit" className="btn" disabled={pending}>{pending ? "Sending" : "Send my application"}</button>
        </div>
        <p className="help">You can follow it under My applications.</p>
      </section>
    </form>
  );
}
