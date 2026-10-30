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
      <div className={`row ${state.errors?.message ? "invalid" : ""}`}>
        <label className="lab" htmlFor="sf-message">Message to the candidate</label>
        <textarea id="sf-message" name="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
        <p className="help">The candidate sees this message and gets an email. Every candidate should get one, and you can edit it.</p>
        {state.errors?.message && <p className="err" role="alert">{state.errors.message}</p>}
      </div>
      {state.error && !state.errors?.message && <p className="err form-err" role="alert">{state.error}</p>}
      {state.message && <p className="ok-msg" role="status">{state.message}</p>}
      <button type="submit" className="btn" disabled={pending || !status}>{pending ? "Saving" : "Save and tell the candidate"}</button>
    </form>
  );
}
