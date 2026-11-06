"use client";

import { useId, useState } from "react";
import type { PayGuideRow } from "@/lib/pay-guide";

// A province drop down over a pay table. Every province's table is in the page, and only the chosen one is shown, so the figures
// are there for search engines and for people who read without scripts running the drop down.
export default function PayGuide({ provinces, rows, initial }: { provinces: string[]; rows: Record<string, PayGuideRow[]>; initial: string }) {
  const [province, setProvince] = useState(initial);
  const id = useId();
  return (
    <div className="paytable">
      <label htmlFor={`${id}-province`}>Province</label>
      <select id={`${id}-province`} value={province} onChange={(e) => setProvince(e.target.value)}>
        {provinces.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <p className="help" role="status">Showing typical pay in {province}.</p>
      {provinces.map((p) => (
        <div key={p} className="tablewrap" hidden={p !== province}>
          <table className="table">
            <caption>Typical pay in {p}</caption>
            <thead>
              <tr>
                <th scope="col">Role</th>
                <th scope="col">Median</th>
                <th scope="col">Middle half of pay</th>
                <th scope="col">Job Bank group</th>
              </tr>
            </thead>
            <tbody>
              {rows[p].map((r) => (
                <tr key={r.role}>
                  <th scope="row">{r.role}</th>
                  <td>
                    {r.median}
                    {r.yearly && <span className="pg-sub">{r.yearly}</span>}
                  </td>
                  <td>{r.middleHalf}</td>
                  <td>
                    {r.group}
                    <span className="pg-sub">{r.years}{r.closest ? ", closest match" : ""}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
