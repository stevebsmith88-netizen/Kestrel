import CountUp from "@/components/CountUp";
import { CHECKED_ON, EYE_CARE_NUMBERS, NUMBER_SOURCES } from "@/lib/eye-care-numbers";

// "Eye care in Canada, in numbers": 4 figures that count up on the home page, and a + that opens where they come from.
// It sits inside the band that holds the clinics and professionals cards, under them.
export default function EyeCareNumbers() {
  return (
    <div className="wrap numwrap" role="region" aria-labelledby="numbers-h">
      <div className="numbox">
          <p className="kicker">Eye care in Canada</p>
          <h2 id="numbers-h">A big field, with a lot of hiring to do</h2>
          <p className="numlede">Thousands of clinics and tens of thousands of people work in eye care across Canada.</p>
          <ul className="numgrid">
            {EYE_CARE_NUMBERS.map((n) => (
              <li key={n.label}>
                <strong className="bignum"><CountUp to={n.value} suffix={n.suffix} /></strong>
                <span className="numlabel">{n.label}</span>
                <span className="numsource">{n.source}</span>
              </li>
            ))}
          </ul>
          <details className="numdetails">
            <summary><span className="plus" aria-hidden="true">+</span> Sources</summary>
            <p className="numhow">
              {NUMBER_SOURCES.map((s, i) => (
                <span key={s.url}>{i > 0 && ", "}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></span>
              ))}
              . Roles a year is our own estimate. Figures are rounded and were last checked {CHECKED_ON}.
            </p>
          </details>
      </div>
    </div>
  );
}
