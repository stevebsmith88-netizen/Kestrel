"use client";

import { useState } from "react";
import { useServerForm } from "@/components/useServerForm";
import { setApplicationStatus } from "@/lib/applicant-actions";
import { APP_LABELS, CLINIC_MOVES, messageTemplate, type AppStatus } from "@/lib/applications";

export default function StatusForm({ id, current, keepDetails, clinicName }: { id: string; current: string; keepDetails: boolean; clinicName: string }) {
  const { state, pending, submit } = useServerForm(setApplicationStatus);
  const moves = CLINIC_MOVES.filter((s) => s !== current && (s !== "kept" || keepDetails));
  const [status, setStatus] = useState<string>(moves[0] ?? "");
  const [message, setMessage] = useState(moves[0] ? messageTemplate(moves[0], clinicName) : "");

  if (current === "hired") return <p className="help">This person is marked as hired, and has been told, so there is nothing more to do.</p>;
  if (current === "withdrawn") return <p className="help">The candidate has withdrawn this application, so there is nothing more to do.</p>;

  return (
    <form onSubmit={submit} noValidate>
      <input type="hidden" name="id" value={id} />
      <div className="row">
        <label className="lab" htmlFor="sf-status">Move this application to</label>
        <select id="sf-status" name="status" value={status} onChange={(e) => { setStatus(e.target.value); setMessage(messageTemplate(e.target.value, clinicName)); }}>
          {moves.map((s) => (
            <option key={s} value={s}>{APP_LABELS[s as AppStatus]}</option>
          ))}
        </select>
      </div>
      {status === "shortlisted" ? (
        <p className="help">Shortlisting is your own working list. The candidate is not emailed and there is no message to write.</p>
      ) : (
        <div className={`row ${state.errors?.message ? "invalid" : ""}`}>
          <label className="lab" htmlFor="sf-message">Message to the candidate</label>
          <textarea id="sf-message" name="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
          <p className="help">The candidate sees this message and gets an email. Every candidate should get one, and you can edit it.</p>
          {state.errors?.message && <p className="err" role="alert">{state.errors.message}</p>}
        </div>
      )}
      {status === "interview" && (
        <div className={`row ${state.errors?.meetingLink ? "invalid" : ""}`}>
          <label className="lab" htmlFor="sf-meeting">Meeting link (optional)</label>
          <input id="sf-meeting" name="meetingLink" type="text" inputMode="url" autoComplete="off" placeholder="https://zoom.us/j/1234567890" aria-describedby="sf-meeting-help" />
          <p className="help" id="sf-meeting-help">Paste a Zoom, Microsoft Teams, Google Meet, Webex or Whereby link and the candidate gets a Join button, so you can leave it out of the message. Create the meeting in your own account first, then paste its link here.</p>
          {state.errors?.meetingLink && <p className="err" role="alert">{state.errors.meetingLink}</p>}
        </div>
      )}
      {state.error && !state.errors?.message && !state.errors?.meetingLink && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending || !status}>{pending ? "Saving" : status === "shortlisted" ? "Save" : "Save and tell the candidate"}</button>
    </form>
  );
}
