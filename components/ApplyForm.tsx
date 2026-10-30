"use client";

import { useRef, useState } from "react";
import { useServerForm } from "@/components/useServerForm";
import { applyToJob } from "@/lib/candidate-actions";
import { wordCount } from "@/lib/applications";

export default function ApplyForm({ jobId, clinicName }: { jobId: string; clinicName: string }) {
  const { state, pending, submit } = useServerForm(applyToJob);
  const [letter, setLetter] = useState("");
  const [nudge, setNudge] = useState(false);
  const skipNudge = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const words = wordCount(letter);

  // The first time someone sends without a letter, we ask once whether they want to add one.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!letter.trim() && !skipNudge.current) {
      e.preventDefault();
      setNudge(true);
      return;
    }
    submit(e);
  };

  return (
    <form ref={form} onSubmit={onSubmit} noValidate className="stackform">
      <input type="hidden" name="jobId" value={jobId} />
      <section className="card" aria-labelledby="cl-h">
        <h2 id="cl-h">Write a short cover letter</h2>
        <p className="help">A few honest lines about why {clinicName} and what you would bring. Your CV says what you have done. Your letter says who you are.</p>
        <p className="chips"><span className="chip">Why this clinic</span><span className="chip">What you would bring</span><span className="chip">When you could start</span></p>
        <label className="lab" htmlFor="af-letter">Your cover letter</label>
        <textarea id="af-letter" name="coverLetter" rows={11} value={letter} onChange={(e) => setLetter(e.target.value)} placeholder={`Dear ${clinicName} team,\n\nI am writing because...`} />
        <div className="letterfoot">
          <span className="help">About 100 to 200 words works well. Write it fresh for each job.</span>
          <span className="help" aria-live="polite">{words} {words === 1 ? "word" : "words"}</span>
        </div>
        {nudge && (
          <div className="note nudge" role="alert">
            <strong>Add a short note before you send?</strong>
            <p>Clinics read the personal ones first. It only takes a couple of minutes.</p>
            <div className="formbtns">
              <button type="button" className="btn sm" onClick={() => { setNudge(false); document.getElementById("af-letter")?.focus(); }}>Write a short note</button>
              <button type="button" className="btn sm ghost" onClick={() => { skipNudge.current = true; form.current?.requestSubmit(); }}>Send without a note</button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <label className="consent">
          <input name="agree" type="checkbox" />
          <span>I agree that {clinicName} can see this application, my CV and my details. Kestrel keeps them private from everyone else.</span>
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
