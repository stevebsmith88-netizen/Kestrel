import Link from "next/link";
import { EmailForm, NameForm, PreferencesForm, type Prefs } from "@/components/AccountForms";
import DeleteAccountForm from "@/components/DeleteAccountForm";

export type AccountViewProps = {
  role: "candidate" | "clinic";
  email: string;
  first: string;
  last: string;
  hasClinic: boolean;
  prefs: Prefs;
  emailNotice?: string;
};

// What the Account page shows: the person's details, their email choices, and the download and delete options.
export default function AccountView({ role, email, first, last, hasClinic, prefs, emailNotice }: AccountViewProps) {
  const home = role === "clinic" ? "/clinic" : "/candidate";
  return (
        <div className="wrap narrow">
          <p className="back"><Link href={home}>Back to my home</Link></p>
          <p className="kicker">My account</p>
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
              <NameForm first={first} last={last} />
              <h3 className="subh">Your email address</h3>
              <EmailForm current={email} />
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
              <p className="help">Get a copy of the information we hold about you as a file. It includes your account, {role === "clinic" ? "clinic profile and job posts" : "profile, applications and job alerts"}. Your CV file can be downloaded from your profile page.</p>
              <a href="/account/export" className="btn ghost" download>Download my information</a>
            </section>

            <section className="card">
              <DeleteAccountForm role={role} />
            </section>
          </div>
        </div>
  );
}
