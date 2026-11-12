"use client";

import { useState } from "react";
import { APP_LABELS, type AppStatus } from "@/lib/applications";
import { stillTalkingMessage } from "@/lib/still-talking";

type Source = { value: string; label: string };
type Candidate = { id: string; name: string; status: string };

// The questions on the "role filled" forms: how the clinic found the person, and, when it was through Kestrel, which applicant it hired.
// The second question and the "another way" box only appear when they apply. The person named is marked as Hired and told, and is
// left out of the "role filled" message that goes to everyone else still waiting (lib/applicant-actions.ts, fillRole).
// Below them, "People you are still talking to" (audit P1-13): everyone at Interview or Offer, each with a kind message to edit, and a tick
// box to leave someone open. They are closed as Role filled and told first. The person chosen as hired drops out of the list.
export default function FilledViaFields({ sources, candidates, idPrefix = "ff", talking = [], clinicName = "" }: { sources: readonly Source[]; candidates: Candidate[]; idPrefix?: string; talking?: Candidate[]; clinicName?: string }) {
  const [via, setVia] = useState("");
  const [hired, setHired] = useState("");
  const stillTalking = talking.filter((t) => !(via === "kestrel" && t.id === hired));
  return (
    <>
      <div className="row">
        <label className="lab" htmlFor={`${idPrefix}-via`}>How did you find the person?</label>
        <select id={`${idPrefix}-via`} name="filledVia" value={via} onChange={(e) => setVia(e.target.value)}>
          <option value="">Choose one (optional)</option>
          {sources.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      {via === "kestrel" && (
        <div className="row">
          <label className="lab" htmlFor={`${idPrefix}-hired`}>Who did you hire?</label>
          <select id={`${idPrefix}-hired`} name="hiredApplicationId" value={hired} onChange={(e) => setHired(e.target.value)}>
            <option value="">Not on this list, or I would rather not say</option>
            {candidates.map((c) => <option key={c.id} value={c.id}>{c.name} ({APP_LABELS[c.status as AppStatus] ?? c.status})</option>)}
          </select>
          <p className="help">The person you choose is marked as Hired and told by email, and in their account. They are not sent the &quot;role filled&quot; message that goes to everyone else.</p>
        </div>
      )}
      {via === "other" && (
        <div className="row">
          <label className="lab" htmlFor={`${idPrefix}-other`}>How was it?</label>
          <input type="text" id={`${idPrefix}-other`} name="filledViaOther" maxLength={200} />
        </div>
      )}
      {stillTalking.length > 0 && (
        <fieldset className="stilltalking">
          <legend>People you are still talking to</legend>
          <p className="help">These people are at Interview or Offer. Each will hear that the role is filled, with the message below, by email and in their account. Edit any message you like. Tick the box to leave someone open, for example if an offer might still fall through.</p>
          {stillTalking.map((t) => (
            <div className="row" key={t.id}>
              <input type="hidden" name="talkingIds" value={t.id} />
              <label className="lab" htmlFor={`${idPrefix}-msg-${t.id}`}>{t.name} ({APP_LABELS[t.status as AppStatus] ?? t.status})</label>
              <textarea id={`${idPrefix}-msg-${t.id}`} name={`talkMsg_${t.id}`} rows={4} maxLength={1500} defaultValue={stillTalkingMessage(clinicName || "our clinic")} />
              <label className="consent"><input type="checkbox" name={`keepOpen_${t.id}`} value="yes" /><span>Don&apos;t close this one yet</span></label>
            </div>
          ))}
        </fieldset>
      )}
    </>
  );
}
