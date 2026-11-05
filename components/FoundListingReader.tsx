"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Choices, Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { readCareersPage, saveFoundListing, type ReadState, type ReadingView, type SaveState } from "@/lib/found-listing-actions";
import { ANSWERS, type FoundClinic } from "@/lib/found-listings";
import { CLINIC_ROLES, EMPLOYMENT_TYPES, employmentLabel, FIELD_ROLES, PAY_PERIODS, PRACTICE_TYPES, PROVINCES, WORK_ARRANGEMENTS } from "@/lib/jobs";

// The found listings tool: paste a careers page, see what Claude found, check and fix each job, then save it.
export default function FoundListingReader({ publishOn }: { publishOn: boolean }) {
  const { state, pending, submit } = useServerForm<ReadState>(readCareersPage);
  const reading = state.reading;
  const e = state.errors ?? {};
  return (
    <>
      <form onSubmit={submit} noValidate className="panel formpanel">
        <h2 className="formh">Read a careers page</h2>
        <Field id="fl-url" label="The careers page or job page" required error={e.url} hint="A page on the clinic's own website. Job boards, recruiters, social networks and college registers are refused.">
          <input id="fl-url" name="url" type="url" inputMode="url" autoComplete="off" placeholder="https://www.clinic.ca/careers" />
        </Field>
        <div className={`row ${e.ownSite ? "invalid" : ""}`}>
          <label className="choice agree">
            <input type="checkbox" name="ownSite" value="yes" />
            <span>This is the clinic&apos;s own website. <span className="req" aria-hidden="true">*</span></span>
          </label>
          {e.ownSite && <p className="err" role="alert">{e.ownSite}</p>}
        </div>
        {state.error && !e.url && !e.ownSite && <p className="err form-err" role="alert">{state.error}</p>}
        {state.message && <p className="ok-msg" role="status">{state.message}</p>}
        <button type="submit" className="btn" disabled={pending}>{pending ? "Reading the page (up to a minute)" : "Read this page"}</button>
      </form>
      {reading && <Results key={reading.readId} reading={reading} publishOn={publishOn} />}
    </>
  );
}

function Results({ reading, publishOn }: { reading: ReadingView; publishOn: boolean }) {
  const [clinic, setClinic] = useState<FoundClinic>(reading.clinic);
  return (
    <section className="stackcards" aria-label="What the reader found">
      <div className="card">
        <h2>What we found</h2>
        <p className="meta">
          <a href={reading.url} target="_blank" rel="noopener noreferrer">{reading.pageTitle || reading.url}<span className="sr"> (opens in a new tab)</span></a>
        </p>
        {reading.notes.length > 0 && (
          <div className="flags">
            <strong>Worth checking</strong>
            <ul>{reading.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          </div>
        )}
        <h3>The clinic</h3>
        <p className="help">Used for every job below. A new clinic profile is made for it, marked as not yet claimed, with no logo.</p>
        <Field id="fl-clinic" label="Clinic name" required>
          <input id="fl-clinic" type="text" value={clinic.name} maxLength={160} onChange={(ev) => setClinic({ ...clinic, name: ev.target.value })} />
        </Field>
        <div className="pair">
          <Field id="fl-practice" label="Practice type" required>
            <select id="fl-practice" value={clinic.practiceType} onChange={(ev) => setClinic({ ...clinic, practiceType: ev.target.value })}>
              <option value="">Choose one</option>
              {PRACTICE_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </Field>
          <Field id="fl-site" label="Clinic website" required hint="The clinic's own home page. Claims are checked against it.">
            <input id="fl-site" type="url" inputMode="url" value={clinic.website} maxLength={300} onChange={(ev) => setClinic({ ...clinic, website: ev.target.value })} />
          </Field>
        </div>
      </div>
      {reading.jobs.map((job, i) => (
        <FoundJobForm key={i} index={i} total={reading.jobs.length} readId={reading.readId} job={job} clinic={clinic} publishOn={publishOn} />
      ))}
    </section>
  );
}

const CLINIC_FIELDS: Record<string, string> = { clinicName: "Clinic name", practiceType: "Practice type", website: "Clinic website" };

function FoundJobForm({ index, total, readId, job, clinic, publishOn }: {
  index: number;
  total: number;
  readId: string;
  job: ReadingView["jobs"][number];
  clinic: FoundClinic;
  publishOn: boolean;
}) {
  const { state, pending, submit } = useServerForm<SaveState>(saveFoundListing);
  const [arrangement, setArrangement] = useState(job.workArrangement);
  const [done, setDone] = useState<SaveState["saved"]>();
  useEffect(() => {
    if (state.saved) setDone(state.saved);
  }, [state.saved]);
  const e = state.errors ?? {};
  const clinicProblems = Object.entries(CLINIC_FIELDS).filter(([k]) => e[k]).map(([k, label]) => `${label}: ${e[k]}`);

  if (done) {
    return (
      <article className="card">
        <h3>{job.title}</h3>
        <p className="ok-msg" role="status">{state.message}</p>
        {done.status === "live" && <p><Link href={`/jobs/${done.jobId}`}>Open the listing</Link></p>}
      </article>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="panel formpanel">
      <h3 className="formh">{total > 1 ? `Job ${index + 1} of ${total}: ` : ""}{job.title}</h3>
      <input type="hidden" name="readId" value={readId} />
      <input type="hidden" name="clinicName" value={clinic.name} />
      <input type="hidden" name="practiceType" value={clinic.practiceType} />
      <input type="hidden" name="website" value={clinic.website} />
      <input type="hidden" name="payAsWritten" value={job.payAsWritten} />

      {job.copied && (
        <div className="flags">
          <strong>Reword the summary before saving</strong>
          <p>It repeats the clinic&apos;s own wording: &quot;{job.copied}&quot;.</p>
        </div>
      )}

      <Field id={`fj-title-${index}`} label="Job title" required error={e.title}>
        <input id={`fj-title-${index}`} name="title" type="text" defaultValue={job.title} maxLength={120} />
      </Field>
      <div className="pair">
        <Field id={`fj-role-${index}`} label="Role" required error={e.roleCategory}>
          <select id={`fj-role-${index}`} name="roleCategory" defaultValue={job.roleCategory}>
            <option value="">Choose one</option>
            <optgroup label="Clinic roles">{CLINIC_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</optgroup>
            <optgroup label="Field and supplier roles">{FIELD_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</optgroup>
          </select>
        </Field>
        <Field id={`fj-type-${index}`} label="Employment type" required error={e.employmentType}>
          <select id={`fj-type-${index}`} name="employmentType" defaultValue={job.employmentType}>
            <option value="">Choose one</option>
            {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{employmentLabel(t)}</option>)}
          </select>
        </Field>
      </div>
      <Choices name="workArrangement" id={`wa-${index}`} label="Where does the person work?" options={WORK_ARRANGEMENTS} value={arrangement} onChange={setArrangement} />
      {arrangement === "field" && (
        <Field id={`fj-area-${index}`} label="Area covered" required error={e.territory}>
          <input id={`fj-area-${index}`} name="territory" type="text" defaultValue={job.territory} maxLength={200} />
        </Field>
      )}
      <div className="pair">
        <Field id={`fj-city-${index}`} label={arrangement === "field" ? "Based in (city)" : "City"} required error={e.city}>
          <input id={`fj-city-${index}`} name="city" type="text" defaultValue={job.city} maxLength={80} />
        </Field>
        <Field id={`fj-prov-${index}`} label="Province or territory" required error={e.province}>
          <select id={`fj-prov-${index}`} name="province" defaultValue={job.province}>
            <option value="">Choose one</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>

      <h4 className="subh">Pay</h4>
      <p className="help">
        {job.payAsWritten
          ? <>The page says: &quot;{job.payAsWritten}&quot;. Check the numbers below match it.</>
          : <>The reader found no pay on the page. A found job is only listed if the clinic&apos;s page states the pay, so check the page. If it has none, leave this job out.</>}
      </p>
      <div className="pair">
        <Field id={`fj-period-${index}`} label="Pay is" required error={e.payPeriod}>
          <select id={`fj-period-${index}`} name="payPeriod" defaultValue={job.payPeriod}>
            <option value="">Choose one</option>
            {PAY_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
        <Field id={`fj-min-${index}`} label="Lowest" required error={e.payMin}>
          <input id={`fj-min-${index}`} name="payMin" type="text" inputMode="decimal" defaultValue={job.payMin} />
        </Field>
        <Field id={`fj-max-${index}`} label="Highest" required error={e.payMax} hint="For a single figure, enter it in both boxes.">
          <input id={`fj-max-${index}`} name="payMax" type="text" inputMode="decimal" defaultValue={job.payMax} />
        </Field>
      </div>

      <Choices name="existingVacancy" id={`ev-${index}`} label="Does the page say this is an existing vacancy?" options={ANSWERS} value={job.existingVacancy} error={e.existingVacancy} hint="Yes or No only if the page says so. Not stated shows as &quot;Not stated by the clinic&quot;." />
      <Choices name="usesAi" id={`ai-${index}`} label="Does the page say whether AI screens applicants?" options={ANSWERS} value={job.usesAi} error={e.usesAi} hint="Yes or No only if the page says so." />

      <Field id={`fj-apply-${index}`} label="Where people apply" required error={e.applyUrl} hint="The clinic's own application page. The Apply button sends people there.">
        <input id={`fj-apply-${index}`} name="applyUrl" type="url" inputMode="url" defaultValue={job.applyUrl} maxLength={500} />
      </Field>
      <Field id={`fj-sum-${index}`} label="Summary, in our own words" required error={e.summary} hint="Facts from the page are fine, the clinic's wording is not. No pay, links, emails or phone numbers.">
        <textarea id={`fj-sum-${index}`} name="summary" rows={8} defaultValue={job.summary} maxLength={3000} />
      </Field>

      <div className={`row ${e.checked ? "invalid" : ""}`}>
        <label className="choice agree">
          <input type="checkbox" name="checked" value="yes" />
          <span>I have checked every fact here against the clinic&apos;s page. <span className="req" aria-hidden="true">*</span></span>
        </label>
        {e.checked && <p className="err" role="alert">{e.checked}</p>}
      </div>

      {clinicProblems.length > 0 && (
        <div className="flags" role="alert">
          <strong>Check the clinic details above</strong>
          <ul>{clinicProblems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      {state.error && <p className="err form-err" role="alert">{state.error}</p>}
      <div className="formbtns">
        <button type="submit" name="intent" value="draft" className="btn ghost" disabled={pending}>{pending ? "Saving" : "Save as a draft"}</button>
        <button type="submit" name="intent" value="publish" className="btn" disabled={pending || !publishOn}>Publish for 21 days</button>
      </div>
      {!publishOn && <p className="help">Publishing is switched off, so save drafts for now.</p>}
    </form>
  );
}
