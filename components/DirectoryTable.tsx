"use client";

import { useId, useState } from "react";
import type { DirectoryEntry } from "@/lib/directory-data";

// A category drop down and a search box over the industry directory. It opens collapsed, and the list appears once a category is chosen
// or something is typed. Every row is in the page all the same, and the filter only hides rows, so the whole directory is there for
// search engines and for people reading without scripts.
export default function DirectoryTable({ entries, categories }: { entries: DirectoryEntry[]; categories: string[] }) {
  const [category, setCategory] = useState("");
  const [text, setText] = useState("");
  const id = useId();
  const needle = text.trim().toLowerCase();
  const shown = (e: DirectoryEntry) =>
    (category === "All" || e.category === category) && (!needle || `${e.name} ${e.what} ${e.based}`.toLowerCase().includes(needle));
  const count = entries.filter(shown).length;
  const open = category !== "" || needle !== "";
  return (
    <div className="directory">
      <div className="dir-controls">
        <div>
          <label htmlFor={`${id}-cat`}>Category</label>
          <select id={`${id}-cat`} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Choose a category</option>
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
      <p className="help" role="status">
        {open ? `Showing ${count} of ${entries.length} companies and organisations.` : `${entries.length} companies and organisations in ${categories.length} categories. Choose a category or search to see the list.`}
      </p>
      <div className="tablewrap" hidden={!open}>
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
