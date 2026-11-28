"use client";

import Link from "next/link";
import { Field } from "@/components/Field";
import { useServerForm } from "@/components/useServerForm";
import { saveInterest } from "@/lib/clinic-interest-actions";
import { PROVINCES } from "@/lib/waitlist";

// Shown under a search for a clinic or company name that has no page on Kestrel. A signed in candidate can say they would like to work there.
export default function ClinicInterest({ name, signedIn }: { name: string; signedIn: "candidate" | "other" | "out" }) {
  const { state, pending, submit } = useServerForm(saveInterest);
  const e = state.errors ?? {};
  return (
    <details className="clinicinterest">
      <summary>Looking for a clinic or company that is not on Kestrel yet?</summary>
      {signedIn === "out" ? (
        <>
        <p>Create a free candidate account, then tell us where you would like to work. If they join Kestrel we will let you know.</p>
        <div className="tilebtns"><Link href="/sign-up?next=%2Fjobs" className="btn sm">Create an account</Link><Link href="/sign-in" className="btn sm ghost">Sign in</Link></div>
        </>
      ) : signedIn === "other" ? (
        <p>Candidates can tell us where they would like to work. Sign in with a candidate account to do that.</p>
      ) : state.message ? (
        <p className="ok-msg" role="status">{state.message}</p>
      ) : (
        <form onSubmit={submit} noValidate>
          <p className="help">Tell us who it is. We keep a count of who people ask about. We do not share your name or details with the clinic, and if they join Kestrel we will let you know.</p>
          <Field id="ci-name" label="Clinic or company name" required error={e.clinicName}>
            <input id="ci-name" name="clinicName" type="text" defaultValue={name} maxLength={120} autoComplete="off" />
          </Field>
          <Field id="ci-town" label="Town or city (optional)">
            <input id="ci-town" name="town" type="text" maxLength={80} autoComplete="off" />
          </Field>
          <Field id="ci-province" label="Province (optional)" error={e.province}>
            <select id="ci-province" name="province" defaultValue="">
              <option value="">Not sure</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field id="ci-website" label="Website (optional)" error={e.website}>
            <input id="ci-website" name="website" type="text" inputMode="url" maxLength={200} autoComplete="off" placeholder="clinicname.ca" />
          </Field>
          {state.error && !Object.keys(e).length && <p className="err form-err" role="alert">{state.error}</p>}
          <button type="submit" className="btn" disabled={pending}>{pending ? "Saving" : "Tell us I would like to work there"}</button>
        </form>
      )}
    </details>
  );
}
