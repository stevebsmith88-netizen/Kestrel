"use client";

import { useState } from "react";
import { useServerForm } from "@/components/useServerForm";
import { setApplicationStatus } from "@/lib/applicant-actions";
import { FORMAT_LABELS, LENGTHS, type InterviewFormat } from "@/lib/interview-details";
import { APP_LABELS, CLINIC_MOVES, messageTemplate, type AppStatus } from "@/lib/applications";

export default function StatusForm({ id, current, keepDetails, clinicName }: { id: string; current: string; keepDetails: boolean; clinicName: string }) {
  const { state, pending, submit } = useServerForm(setApplicationStatus);
  const moves = CLINIC_MOVES.filter((s) => s !== current && (s !== "kept" || keepDetails));
  const [status, setStatus] = useState<string>(moves[0] ?? "");
  const [format, setFormat] = useState<InterviewFormat | "">("");
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
        <fieldset className="row interviewfields">
          <legend className="lab">How will the interview happen? <span className="req" aria-hidden="true">*</span></legend>
          <div className={`choices ${state.errors?.format ? "invalid" : ""}`}>
            {(Object.keys(FORMAT_LABELS) as InterviewFormat[]).map((f) => (
              <label className="choice" key={f}>
                <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} />
                <span>{FORMAT_LABELS[f]}</span>
              </label>
            ))}
          </div>
          {state.errors?.format && <p className="err" role="alert">{state.errors.format}</p>}
          <div className={`row ${state.errors?.date ? "invalid" : ""}`}>
            <label className="lab" htmlFor="sf-date">Date and time (optional, but it lets us send a calendar invite)</label>
            <div className="datetime">
              <input id="sf-date" name="date" type="date" aria-label="Date" />
              <input id="sf-time" name="time" type="time" aria-label="Start time" />
              <select id="sf-minutes" name="minutes" defaultValue="30" aria-label="How long">
                {LENGTHS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
              </select>
            </div>
            <p className="help">Times are in your clinic&apos;s local time, and the candidate sees the time zone.</p>
            {state.errors?.date && <p className="err" role="alert">{state.errors.date}</p>}
          </div>
          {format === "in_person" && (
            <div className={`row ${state.errors?.place ? "invalid" : ""}`}>
              <label className="lab" htmlFor="sf-place">Address</label>
              <input id="sf-place" name="place" type="text" maxLength={200} autoComplete="off" />
              {state.errors?.place && <p className="err" role="alert">{state.errors.place}</p>}
            </div>
          )}
          {format === "online" && (
            <div className={`row ${state.errors?.meetingLink ? "invalid" : ""}`}>
              <label className="lab" htmlFor="sf-meeting">Meeting link (optional)</label>
              <input id="sf-meeting" name="meetingLink" type="text" inputMode="url" autoComplete="off" placeholder="https://zoom.us/j/1234567890" aria-describedby="sf-meeting-help" />
              <p className="help" id="sf-meeting-help">Paste a Zoom, Microsoft Teams, Google Meet, Webex or Whereby link and the candidate gets a Join button. Create the meeting in your own account first, then paste its link here.</p>
              {state.errors?.meetingLink && <p className="err" role="alert">{state.errors.meetingLink}</p>}
            </div>
          )}
          {format === "phone" && <p className="help">The candidate is told you will call them on the number in their application.</p>}
        </fieldset>
      )}
      {state.error && !state.errors?.message && !state.errors?.meetingLink && !state.errors?.format && !state.errors?.date && !state.errors?.place && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending || !status}>{pending ? "Saving" : status === "shortlisted" ? "Save" : "Save and tell the candidate"}</button>
    </form>
  );
}
