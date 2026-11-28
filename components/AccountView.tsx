import Link from "next/link";
import { EmailForm, NameForm, PreferencesForm, type Prefs } from "@/components/AccountForms";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import { Field } from "@/components/Field";
import { EXPORT_PROBLEMS, type ExportProblem } from "@/lib/export-check";

export type AccountViewProps = {
  // People on the clinic's team besides the owner (migration 0045). An owner with a team hands the clinic over before deleting their account.
  teamCount?: number;
  role: "candidate" | "clinic";
  email: string;
  first: string;
  nameLockedUntil?: string | null;
  nameInPlay?: boolean; // the candidate has an application still in play, so the name cannot change
  last: string;
  hasClinic: boolean;
  hasPassword: boolean;
  prefs: Prefs;
  emailNotice?: string;
  downloadProblem?: ExportProblem;
};

// What the Account page shows: the person's details, their email choices, and the download and delete options.
export default function AccountView({ role, email, first, last, nameLockedUntil, nameInPlay = false, hasClinic, hasPassword, prefs, emailNotice, downloadProblem, teamCount = 0 }: AccountViewProps) {
  const home = role === "clinic" ? "/clinic" : "/candidate";
  return (
        <div className="wrap narrow">
          <p className="back"><Link href={home}>Back to my dashboard</Link></p>
          <h1>Your account</h1>
          {emailNotice === "confirmed" && <p className="notice" role="status">Thank you, that is confirmed. If we asked you to confirm from both your old and new address, make sure you have opened both emails.</p>}

          <div className="stackcards">
            <section className="card" aria-labelledby="ac-details">
              <h2 id="ac-details">Your details</h2>
              <dl className="facts">
                <div><dt>Account type</dt><dd>{role === "clinic" ? "Clinic" : "Candidate"}</dd></div>
                <div><dt>Sign in email</dt><dd>{email}</dd></div>
              </dl>
              <h3 className="subh">Your name</h3>
              <NameForm first={first} last={last} lockedUntil={nameLockedUntil ?? null} inPlay={nameInPlay} />
              <h3 className="subh">Your email address</h3>
              <EmailForm current={email} hasPassword={hasPassword} />
            </section>

            <section className="card" aria-labelledby="ac-email-prefs">
              <h2 id="ac-email-prefs">Email choices</h2>
              <PreferencesForm
                role={role}
                hasClinic={hasClinic}
                prefs={prefs}
              />
              {role === "candidate" && <p className="help"><Link href="/candidate/alerts">Choose which jobs to be alerted about, and how often</Link></p>}
              {role === "clinic" && <p className="help">The private address that new applicant emails go to is on your <Link href="/clinic/profile">clinic profile</Link>.</p>}
            </section>

            <section className="card" aria-labelledby="ac-download">
              <h2 id="ac-download">Download your information</h2>
              <p className="help">Get a copy of the information we hold about you as a file. It includes your account, {role === "clinic" ? "clinic profile and job posts" : "profile, applications and job alerts"}. Your resume file can be downloaded from your profile page.</p>
              {/* Asks for the password first, as delete does (P1-49). A plain form, so the browser saves the file it gets back. */}
              <form method="post" action="/account/export" className="stackform" noValidate>
                {hasPassword ? (
                  <Field id="dl-password" label="Your password" required error={downloadProblem && downloadProblem !== "wrong-email" ? EXPORT_PROBLEMS[downloadProblem] : undefined} hint="So we know it is you.">
                    <input id="dl-password" name="password" type="password" autoComplete="current-password" />
                  </Field>
                ) : (
                  <Field id="dl-email" label="Type your email address" required error={downloadProblem === "wrong-email" ? EXPORT_PROBLEMS[downloadProblem] : undefined} hint={`You sign in with Google, so there is no password. Type ${email} to confirm it is you.`}>
                    <input id="dl-email" name="confirmEmail" type="email" autoComplete="off" />
                  </Field>
                )}
                <button type="submit" className="btn ghost">Download my information</button>
              </form>
            </section>

            <details className="quietdelete" id="delete-account">
              <summary>Delete my account</summary>
              <section className="card">
                {teamCount > 0 ? (
                  <>
                    <h2>Delete my account</h2>
                    <p>Your clinic has {teamCount} {teamCount === 1 ? "other person" : "other people"} on its team. Deleting your account would delete the clinic, its jobs and their access too.</p>
                    <p>To leave Kestrel and keep the clinic going, hand it to someone on your team first, from <Link href="/clinic/team">Clinic team</Link> (open <strong>Hand the clinic over</strong> beside their name). Then you can delete your account. To close the clinic for everyone, remove your team first.</p>
                  </>
                ) : (
                  <DeleteAccountForm role={role} hasPassword={hasPassword} email={email} />
                )}
              </section>
            </details>
          </div>
        </div>
  );
}
