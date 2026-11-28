import CopyButton from "@/components/CopyButton";
import Icon from "@/components/Icon";
import { doesSummary, licenceRole, licenceSummary, registerAdvice, registerFor, registerLink, type Licence } from "@/lib/licence";

// What a clinic sees about an optometrist or optician's registration, inside an application (Steve, 19th November 2026). The number is the
// candidate's own answer and is not checked by Kestrel. The button opens the College's own register in a new tab, and the wording beside it
// says how to check it there (lib/licence.ts holds what was seen on each register).
export default function RegisterCheck({ profession, licence, candidateName }: { profession: string | null | undefined; licence: Licence | null | undefined; candidateName?: string | null }) {
  const role = licenceRole(profession);
  if (!role) return null;
  const register = licence?.number ? registerFor(role, licence.province) : null;
  const advice = register ? registerAdvice(register) : null;
  const does = doesSummary(licence);
  return (
    <section className="card registercheck">
      <h2>Registration</h2>
      <dl className="facts">
        <div><dt>Registration number</dt><dd>{licenceSummary(profession, licence)}</dd></div>
        {does && <div><dt>Registered for</dt><dd>{does}</dd></div>}
      </dl>
      {licence?.number ? (
        <>
          <p className="help">Entered by the candidate, not checked by Kestrel.</p>
          {register && advice && (
            <p className="registeractions">
              {registerLink(register, candidateName) && (
                <a className="btn sm ghost" href={registerLink(register, candidateName) ?? undefined} target="_blank" rel="noopener noreferrer">
                  {advice.button} <Icon name="external" /><span className="sr"> (opens in a new tab)</span>
                </a>
              )}{" "}
              <CopyButton text={licence.number} label="Copy number" />
            </p>
          )}
          {advice && <p className="help">{advice.help}</p>}
        </>
      ) : licence?.notYet ? (
        <p className="help">The candidate says they are not registered yet. Check their status with the College before offering the role.</p>
      ) : (
        <p className="help">They did not give a registration number.</p>
      )}
    </section>
  );
}
