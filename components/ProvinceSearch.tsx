"use client";

import { useState } from "react";
import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { findContactEmails, saveLead, searchProvince, townsToSearch, type EmailState, type LeadSaveState, type LeadView, type SearchState } from "@/lib/lead-actions";
import { PROVINCES, ROLE_CATEGORIES } from "@/lib/jobs";

const SOURCE: Record<string, string> = { own_site: "The clinic's own site", hiring_system: "The clinic's hiring page", job_board: "Seen on a job board" };

// Province search: clinics that appear to be hiring. Each card shows what the page says, and offers the next steps.
type Sweep = { running: boolean; progress: string; leads: LeadView[]; dropped: number; message?: string; error?: string };
const hostKey = (website: string) => {
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return website;
  }
};

export default function ProvinceSearch({ onUsePage, onFindPage }: { onUsePage: (url: string) => void; onFindPage: (website: string) => void }) {
  const { state, pending, submit } = useServerForm<SearchState>(searchProvince);
  const e = state.errors ?? {};
  return (
    <section aria-label="Province search" className="stackcards">
      <form onSubmit={submit} noValidate className="panel formpanel">
        <h2 className="formh">1. Find clinics that are hiring</h2>
        <p className="help">Claude searches the web for eye care employers in the province, then finds each one&apos;s own website. Job boards can show that a clinic is hiring, but Indeed, LinkedIn, Jobs4ECPs, college registers and Eye Recommend are never used. It takes up to 2 minutes.</p>
        <div className="pair">
          <Field id="ps-province" label="Province or territory" required error={e.province}>
            <select id="ps-province" name="province" defaultValue="">
              <option value="">Choose one</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field id="ps-role" label="Role">
            <select id="ps-role" name="role" defaultValue="">
              <option value="">Any role</option>
              {ROLE_CATEGORIES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
        <Field id="ps-city" label="City or area (optional)" hint="Narrow it to a town if a whole province finds too much.">
          <input id="ps-city" name="city" type="text" maxLength={60} autoComplete="off" />
        </Field>
        {state.error && !e.province && <p className="err form-err" role="alert">{state.error}</p>}
        <button type="submit" className="btn" disabled={pending}>{pending ? "Searching (up to 2 minutes)" : "Search"}</button>
      </form>
      {state.message && (
        <div role="status">
          <p className="resultcount">{state.message}</p>
          {state.leftOut && <p className="help">{state.leftOut}</p>}
        </div>
      )}
      {state.leads && state.leads.length > 0 && (
        <div className="leadlist">
          {state.leads.map((lead) => <LeadCard key={lead.website} lead={lead} onUsePage={onUsePage} onFindPage={onFindPage} />)}
        </div>
      )}
    </section>
  );
}

function LeadCard({ lead, onUsePage, onFindPage }: { lead: LeadView; onUsePage: (url: string) => void; onFindPage: (website: string) => void }) {
  const emails = useServerForm<EmailState>(findContactEmails);
  const save = useServerForm<LeadSaveState>(saveLead);
  const [email, setEmail] = useState("");
  const [emailSource, setEmailSource] = useState("");
  const chosen = emails.state.emails ?? [];
  const pick = (address: string, source: string) => {
    setEmail(address);
    setEmailSource(source);
  };
  const done = save.state.saved || lead.saved;
  const where = [lead.city, lead.province].filter(Boolean).join(", ");
  return (
    <details className="card leadrow">
      <summary>
        <span className="leadmain">
          <strong>{lead.clinicName}</strong>
          <span className="meta">{lead.jobTitle || "Hiring"}{lead.employmentType ? `, ${lead.employmentType}` : ""} · {where} · {lead.postedText || "no date on the page"}</span>
        </span>
        <span className="leadflags">
          {!lead.locationConfirmed && <span className="chip">Location not confirmed</span>}
          {lead.source === "job_board" && <span className="chip">Seen on a job board</span>}
          {done && <span className="chip paychip">Saved</span>}
        </span>
      </summary>
      <div className="leadbody">
        <dl className="facts">
          <div><dt>Job</dt><dd>{lead.jobTitle || "Not stated"}{lead.employmentType ? `, ${lead.employmentType}` : ""}</dd></div>
          <div><dt>Where</dt><dd>{where}{lead.locationConfirmed ? "" : " (not confirmed by the page)"}</dd></div>
          <div><dt>Posted</dt><dd>{lead.postedText || "Not stated on the page"}</dd></div>
          <div><dt>Pay</dt><dd>{lead.payAsWritten || "Not stated on the page"}</dd></div>
          <div><dt>Seen at</dt><dd>{lead.sourceUrl ? <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer">{SOURCE[lead.source]}<span className="sr"> (opens in a new tab)</span></a> : SOURCE[lead.source]}</dd></div>
          <div><dt>Website</dt><dd><a href={lead.website} target="_blank" rel="noopener noreferrer">{lead.website.replace(/^https?:\/\//, "")}<span className="sr"> (opens in a new tab)</span></a></dd></div>
        </dl>
        {lead.note && <p className="help">{lead.note}</p>}

        <div className="formbtns">
          {lead.careersUrl
            ? <button type="button" className="btn ghost" onClick={() => onUsePage(lead.careersUrl)}>Read their careers page</button>
            : <button type="button" className="btn ghost" onClick={() => onFindPage(lead.website)}>Find their careers page</button>}
          <form onSubmit={emails.submit} noValidate>
            <input type="hidden" name="website" value={lead.website} />
            <input type="hidden" name="careersUrl" value={lead.careersUrl} />
            <button type="submit" className="btn ghost" disabled={emails.pending}>{emails.pending ? "Looking" : "Find a contact email"}</button>
          </form>
        </div>

        {emails.state.error && <p className="err form-err" role="alert">{emails.state.error}</p>}
        {emails.state.message && <p className="help" role="status">{emails.state.message}</p>}
        {chosen.length > 0 && (
          <ul className="plainlist">
            {chosen.map((c) => (
              <li key={c.email}>
                {c.email} <span className="help">published on <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">this page<span className="sr"> (opens in a new tab)</span></a></span>{" "}
                <button type="button" className="linkbtn" onClick={() => pick(c.email, c.sourceUrl)}>{email === c.email ? "Chosen" : "Keep this one"}</button>
              </li>
            ))}
          </ul>
        )}

        {done ? <p className="ok-msg" role="status">{save.state.message || "Saved to your leads."}</p> : (
          <form onSubmit={save.submit} noValidate>
            {([
              ["clinicName", lead.clinicName], ["website", lead.website], ["province", lead.province], ["city", lead.city], ["practiceType", lead.practiceType],
              ["careersUrl", lead.careersUrl], ["jobTitle", lead.jobTitle], ["roleCategory", lead.roleCategory], ["postedText", lead.postedText],
              ["payAsWritten", lead.payAsWritten], ["sourceUrl", lead.sourceUrl], ["source", lead.source], ["note", lead.note],
              ["contactEmail", email], ["emailSourceUrl", emailSource],
            ] as const).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
            {save.state.error && <p className="err form-err" role="alert">{save.state.error}</p>}
            <button type="submit" className="btn" disabled={save.pending}>{save.pending ? "Saving" : email ? `Save lead with ${email}` : "Save lead without an email"}</button>
          </form>
        )}
      </div>
    </details>
  );
}
