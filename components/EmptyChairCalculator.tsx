"use client";

import { useState } from "react";
import { CHAIR_DEFAULTS, emptyChairCost, roughDollars, type ChairInputs } from "@/lib/empty-chair";

// The empty optician chair calculator (lib/empty-chair.ts). Everything happens in the browser: nothing typed is saved or sent.
const FIELDS: { key: keyof ChairInputs; label: string; hint: string; step: number }[] = [
  { key: "examsPerMonth", label: "Full eye exams a month", hint: "About 9 a day is 230 a month.", step: 10 },
  { key: "needGlassesPercent", label: "Patients who need new glasses (%)", hint: "A University of Waterloo study found 41%.", step: 1 },
  { key: "lostSalesPercent", label: "Of those sales, lost while you are short (%)", hint: "Your own guess. 10% is 1 in 10.", step: 1 },
  { key: "averageSale", label: "Average glasses sale ($)", hint: "An example. Yours will differ.", step: 25 },
  { key: "dispensingHoursPerWeek", label: "Hours a week your optometrist dispenses", hint: "1 hour a day is 5 a week.", step: 1 },
  { key: "examsPerHour", label: "Exams an hour", hint: "Most clinics book about 2.", step: 1 },
  { key: "examFee", label: "Exam fee ($)", hint: "Often $200 to $250 with imaging.", step: 10 },
];

export default function EmptyChairCalculator() {
  const [v, setV] = useState<ChairInputs>(CHAIR_DEFAULTS);
  const r = emptyChairCost(v);
  return (
    <section className="chaircalc" id="empty-chair" aria-labelledby="chaircalc-h">
      <h2 id="chaircalc-h">What an empty optician chair costs you</h2>
      <p>
        The numbers below are an example clinic. Put in your own. Nothing you type is saved or sent anywhere.
      </p>
      <div className="chaircalc-grid">
        {FIELDS.map((f) => (
          <div className="row" key={f.key}>
            <label className="lab" htmlFor={`chair-${f.key}`}>{f.label}</label>
            <input
              id={`chair-${f.key}`}
              type="number"
              inputMode="decimal"
              min={0}
              step={f.step}
              value={Number.isFinite(v[f.key]) ? v[f.key] : ""}
              onChange={(e) => setV({ ...v, [f.key]: e.target.value === "" ? Number.NaN : Number(e.target.value) })}
              aria-describedby={`chair-${f.key}-hint`}
            />
            <p className="help" id={`chair-${f.key}-hint`}>{f.hint}</p>
          </div>
        ))}
      </div>
      <div className="chaircalc-result" aria-live="polite">
        <p className="chaircalc-total">About <strong>{roughDollars(r.total)}</strong> a month</p>
        <p>
          Glasses sales that walk out: about {roughDollars(r.glasses)} ({r.lostSales.toFixed(1)} sales a month at {roughDollars(v.averageSale || 0)}).
        </p>
        <p>
          Exam time lost to dispensing: about {roughDollars(r.examTime)} ({r.examsLost.toFixed(1)} exams a month not booked).
        </p>
        <p className="small-note">
          An estimate from your own numbers, not a promise. It leaves out overtime, locum days and the hours you spend screening applicants.
        </p>
      </div>
    </section>
  );
}
