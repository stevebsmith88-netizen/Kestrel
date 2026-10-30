"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { QUESTIONS, ROLE_BLURBS, searchLink, topMatches, type Answers } from "@/lib/quiz";

export default function FitQuiz({ signedInAs }: { signedInAs: "candidate" | "other" | null }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const finished = step >= QUESTIONS.length;
  const q = QUESTIONS[step];

  // Move focus to the new question or the results, so a screen reader announces the change.
  useEffect(() => {
    if (step > 0 || answers.work) heading.current?.focus();
  }, [step, answers.work]);

  const choose = (value: string) => setAnswers((a) => ({ ...a, [q.id]: value }));
  const current = q ? answers[q.id] : undefined;

  if (finished) {
    const matches = topMatches(answers);
    return (
      <section aria-labelledby="fit-results">
        <h2 id="fit-results" tabIndex={-1} ref={heading}>Roles that could suit you</h2>
        <p className="help">A starting point, not a verdict. Nothing you answered has been saved.</p>
        <div className="stackcards">
          {matches.map((m, i) => (
            <article className="card" key={m.role}>
              <p className="kicker">{i === 0 ? "Best match" : "Also worth a look"}</p>
              <h3>{m.role}</h3>
              <p>{ROLE_BLURBS[m.role]}</p>
              {m.reasons.filter(Boolean).length > 0 && (
                <ul>{m.reasons.filter(Boolean).slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>
              )}
              <Link href={searchLink(m.role, answers)} className="btn sm">See {m.role} jobs</Link>
            </article>
          ))}
        </div>
        <section className="card paper">
          <h3>Hear about new jobs like these</h3>
          {signedInAs === "candidate" ? (
            <p>Set up a job alert and we will email you when a matching job is posted. <Link href="/candidate/alerts">Set up an alert</Link></p>
          ) : signedInAs === null ? (
            <p>Create a free account, save your CV once and set up job alerts. <Link href="/sign-up">Create an account</Link></p>
          ) : (
            <p>Job alerts are for candidate accounts.</p>
          )}
        </section>
        <p><button type="button" className="linkbtn" onClick={() => { setAnswers({}); setStep(0); }}>Start again</button></p>
      </section>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (current) setStep(step + 1); }} noValidate>
      <p className="help" aria-live="polite">Question {step + 1} of {QUESTIONS.length}</p>
      <div className="meter" role="img" aria-label={`Question ${step + 1} of ${QUESTIONS.length}`}><i style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} /></div>
      <fieldset className="quizset">
        <legend><h2 tabIndex={-1} ref={heading}>{q.title}</h2></legend>
        {q.hint && <p className="help">{q.hint}</p>}
        {q.select ? (
          <select aria-label={q.title} value={current ?? ""} onChange={(e) => choose(e.target.value)}>
            <option value="">Choose one</option>
            {q.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <div className="quizoptions" role="radiogroup">
            {q.options.map((o) => (
              <label className="choice" key={o.value}>
                <input type="radio" name={q.id} value={o.value} checked={current === o.value} onChange={() => choose(o.value)} />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <div className="formbtns">
        {step > 0 && <button type="button" className="btn ghost" onClick={() => setStep(step - 1)}>Back</button>}
        <button type="submit" className="btn" disabled={!current}>{step === QUESTIONS.length - 1 ? "See my roles" : "Next"}</button>
      </div>
    </form>
  );
}
