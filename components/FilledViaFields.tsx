"use client";

import { useState } from "react";
import { APP_LABELS, type AppStatus } from "@/lib/applications";

type Source = { value: string; label: string };
type Candidate = { id: string; name: string; status: string };

// The questions on the "role filled" forms: how the clinic found the person, and, when it was through Kestrel, which applicant it hired.
// The second question and the "another way" box only appear when they apply. The person named is marked as Hired and told, and is
// left out of the "role filled" message that goes to everyone else still waiting (lib/applicant-actions.ts, fillRole).
export default function FilledViaFields({ sources, candidates, idPrefix = "ff" }: { sources: readonly Source[]; candidates: Candidate[]; idPrefix?: string }) {
  const [via, setVia] = useState("");
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
          <select id={`${idPrefix}-hired`} name="hiredApplicationId" defaultValue="">
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
    </>
  );
}
