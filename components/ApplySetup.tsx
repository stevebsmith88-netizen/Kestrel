"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveApplyBasics, suggestFromSavedResume, uploadForApply, type ApplySetupState } from "@/lib/apply-setup-actions";
import { PROVINCES, ROLE_CATEGORIES } from "@/lib/jobs";
import type { ResumeBasics } from "@/lib/resume-actions";

const ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// A first application without the detour to the profile page. The resume uploads as soon as it is chosen and is read on our own server;
// the role, town and province it finds are filled in for the candidate to check. When those are saved, the page reloads into the
// normal apply form. Only what is missing is asked for.
export default function ApplySetup({ needsResume, needsRole, needsTown, current }: { needsResume: boolean; needsRole: boolean; needsTown: boolean; current: ResumeBasics }) {
  const router = useRouter();
  const upload = useServerForm<ApplySetupState>(uploadForApply);
  const basics = useServerForm<ApplySetupState>(saveApplyBasics);
  const fileForm = useRef<HTMLFormElement>(null);
  const [found, setFound] = useState<ResumeBasics>({});
  const [reading, setReading] = useState(false);
  const resumeDone = !needsResume || Boolean(upload.state.uploaded);

  // Someone whose resume is already saved gets the same suggestions, read once.
  useEffect(() => {
    if (needsResume || (!needsRole && !needsTown)) return;
    let live = true;
    setReading(true);
    suggestFromSavedResume().then((b) => { if (live) setFound(b); }).catch(() => {}).finally(() => { if (live) setReading(false); });
    return () => { live = false; };
  }, [needsResume, needsRole, needsTown]);

  useEffect(() => { if (upload.state.basics) setFound(upload.state.basics); }, [upload.state.basics]);

  // Nothing else is missing once the resume is in, or the 3 answers are saved: show the apply form.
  useEffect(() => {
    if (basics.state.message === "saved" || (upload.state.uploaded && !needsRole && !needsTown)) router.refresh();
  }, [basics.state.message, upload.state.uploaded, needsRole, needsTown, router]);

  const role = found.profession ?? current.profession ?? "";
  const city = found.city ?? current.city ?? "";
  const province = found.province ?? current.province ?? "";

  return (
    <section className="card setup" aria-labelledby="as-h">
      <h2 id="as-h">{needsResume ? "Add your resume to apply" : "2 quick answers to apply"}</h2>
      <p className="help">Your resume and these answers are saved to your profile, so your next application takes a few taps. Clinics never see your town.</p>

      {needsResume && (
        <form ref={fileForm} onSubmit={upload.submit} noValidate className="stackform">
          <Field id="as-file" label="Your resume" hint="PDF or Word, up to 4 MB. It uploads as soon as you choose it." error={upload.state.error}>
            <input id="as-file" name="cv" type="file" accept={ACCEPT} disabled={upload.pending || resumeDone} onChange={(e) => { if (e.currentTarget.files?.length) fileForm.current?.requestSubmit(); }} />
          </Field>
          <p className="help" aria-live="polite">{upload.pending ? "Saving and reading your resume" : resumeDone ? "Your resume is saved." : ""}</p>
          <noscript><button type="submit" className="btn sm">Upload</button></noscript>
        </form>
      )}

      {resumeDone && (needsRole || needsTown) && (
        <form onSubmit={basics.submit} noValidate className="stackform" key={`${role}|${city}|${province}`}>
          {reading && <p className="help" aria-live="polite">Reading your resume</p>}
          {(found.profession || found.city) && <p className="help">We filled in what we found on your resume. Please check it.</p>}
          {needsRole && (
            <Field id="as-role" label="Your role" required error={basics.state.errors?.profession}>
              <select id="as-role" name="profession" defaultValue={role}>
                <option value="">Choose one</option>
                {ROLE_CATEGORIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          )}
          {needsTown && (
            <>
              <Field id="as-city" label="Your town or city" required hint="Used to show jobs near you. Clinics never see it." error={basics.state.errors?.homeCity}>
                <input id="as-city" name="homeCity" type="text" autoComplete="address-level2" defaultValue={city} maxLength={80} />
              </Field>
              <Field id="as-prov" label="Its province or territory" required error={basics.state.errors?.homeProvince}>
                <select id="as-prov" name="homeProvince" defaultValue={province}>
                  <option value="">Choose one</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </>
          )}
          {basics.state.error && <p className="err form-err" role="alert">{basics.state.error}</p>}
          <div className="formbtns">
            <button type="submit" className="btn" disabled={basics.pending}>{basics.pending ? "Saving" : "Save and continue"}</button>
          </div>
        </form>
      )}
    </section>
  );
}
