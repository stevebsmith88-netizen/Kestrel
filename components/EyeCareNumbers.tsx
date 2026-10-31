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
            <summary><span className="plus" aria-hidden="true">+</span> Where these numbers come from</summary>
            <div className="numhow">
              <p><strong>Optometrists and opticians.</strong> About 6,400 optometrists and 11,700 opticians were working in Canada in 2023, according to Statistics Canada.</p>
              <p><strong>Optometry practices.</strong> Industry directories count between about 4,300 and 7,000 optometry practices in Canada, depending on who is counted. We show the lower figure.</p>
              <p><strong>Roles advertised each year.</strong> This is our own estimate, not an official figure. We think about 31,000 to 39,000 people work in eye care practices and optical retail (the optometrists and opticians above, plus support and management staff that we estimate). We assume that 12% to 22% of roles turn over or grow each year, and that most are advertised publicly. That gives about 2,200 to 6,900 roles a year, so we say more than 2,000. The real number may well be higher.</p>
              <p className="srcs">Sources and further reading:</p>
              <ul>
                {NUMBER_SOURCES.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></li>
                ))}
              </ul>
              <p className="srcs">Figures are rounded and change over time. Last checked {CHECKED_ON}.</p>
            </div>
          </details>
      </div>
    </div>
  );
}
