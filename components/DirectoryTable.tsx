"use client";

import { useId, useState } from "react";
import type { DirectoryEntry } from "@/lib/directory-data";

// A category drop down and a search box over the industry directory. Every row is in the page, and the filter only hides rows,
// so the whole directory is there for search engines and for people reading without scripts.
export default function DirectoryTable({ entries, categories }: { entries: DirectoryEntry[]; categories: string[] }) {
  const [category, setCategory] = useState("All");
  const [text, setText] = useState("");
  const id = useId();
  const needle = text.trim().toLowerCase();
  const shown = (e: DirectoryEntry) =>
    (category === "All" || e.category === category) && (!needle || `${e.name} ${e.what} ${e.based}`.toLowerCase().includes(needle));
  const count = entries.filter(shown).length;
  return (
    <div className="directory">
      <div className="dir-controls">
        <div>
          <label htmlFor={`${id}-cat`}>Category</label>
          <select id={`${id}-cat`} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All categories ({entries.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c} ({entries.filter((e) => e.category === c).length})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-q`}>Search</label>
          <input id={`${id}-q`} type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Company, product or place" />
        </div>
      </div>
      <p className="help" role="status">Showing {count} of {entries.length} companies and organisations.</p>
      <div className="tablewrap">
        <table className="table dir-table">
          <caption>Eye care suppliers and organisations in Canada</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Category</th>
              <th scope="col">What they do</th>
              <th scope="col">Based in</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={`${e.category}-${e.name}`} hidden={!shown(e)}>
                <th scope="row">
                  {e.name}
                  {e.sites.map((s) => (
                    <a key={s} className="pg-sub" href={`https://${s.replace(/^https?:\/\//, "")}`} rel="noopener">{s}</a>
                  ))}
                </th>
                <td>{e.category}</td>
                <td>{e.what}</td>
                <td>{e.based}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
