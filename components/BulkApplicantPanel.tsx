"use client";

import { useRef, useState, type MouseEvent } from "react";

type BulkAction = (form: FormData) => void | Promise<void>;

// The "With the ticked applicants" box on the applicants page. It sits inside the page's form, so the 3 buttons send the ticked
// applicants (and the message) to the server. The checks for "nothing ticked" and "no interview message" happen here, on the
// page, before anything is sent, so the ticks and the message are never lost. The server checks again, for a browser without
// scripts (lib/applicant-actions.ts).
export default function BulkApplicantPanel({ shortlist, interview }: { shortlist: BulkAction; interview: BulkAction }) {
  const [problem, setProblem] = useState("");
  const message = useRef<HTMLTextAreaElement>(null);

  function check(e: MouseEvent<HTMLButtonElement>, needsMessage: boolean) {
    const form = e.currentTarget.form;
    if (!form) return;
    if (!form.querySelector('input[name="ids"]:checked')) {
      e.preventDefault();
      setProblem("Tick at least one applicant first.");
      return;
    }
    if (needsMessage) {
      const text = message.current?.value.trim() ?? "";
      if (!text) {
        e.preventDefault();
        setProblem("Write your interview invitation first. Include the date, time and how to join. Everyone you tick gets the same message.");
        message.current?.focus();
        return;
      }
      if (/\[[^\]]+\]/.test(text)) {
        e.preventDefault();
        setProblem("Please replace the square brackets in your message with the real details before sending.");
        message.current?.focus();
        return;
      }
    }
    setProblem("");
  }

  return (
    <section className="card bulkpanel" aria-labelledby="bulk-title">
      <h2 id="bulk-title">With the ticked applicants</h2>
      <ul className="bulkhelp">
        <li><strong>Shortlist</strong> is your own working list. No email is sent.</li>
        <li><strong>Invite to interview</strong> sends everyone you tick the message below, by email and in their account. For different times, open each application.</li>
        <li><strong>Send a kind no</strong> gives each person the same warm message you would send one at a time, by email and in their account.</li>
      </ul>
      <label className="lab" htmlFor="bulkMessage">Interview invitation (used only for Invite to interview)</label>
      <textarea
        ref={message}
        id="bulkMessage"
        name="message"
        rows={3}
        maxLength={1500}
        aria-describedby={problem ? "bulk-problem" : undefined}
        onChange={() => problem && setProblem("")}
        placeholder="For example: We would like to meet you at the clinic on Tuesday 24th November at 2 pm. Please reply to this email to confirm, or to suggest another time."
      />
      <p className="help">Offers are never made in bulk. Open the application to make one.</p>
      {problem && <p className="notice warn bulkproblem" id="bulk-problem" role="alert">{problem}</p>}
      <div className="bulkbtns">
        <button type="submit" formAction={shortlist} className="btn sm" onClick={(e) => check(e, false)}>Shortlist</button>
        <button type="submit" formAction={interview} className="btn sm" onClick={(e) => check(e, true)}>Invite to interview</button>
        <button type="submit" className="btn sm ghost" onClick={(e) => check(e, false)}>Send a kind no</button>
      </div>
    </section>
  );
}
