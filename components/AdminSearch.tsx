import Link from "next/link";

// The search box at the top of an admin list (Steve, 14th November 2026): a labelled text box, a Search button and, once a search is in use,
// a Clear button. Plain text input so it matches every other field, and a form that works with no script.
export default function AdminSearch({ id, label, defaultValue, clearHref }: { id: string; label: string; defaultValue: string; clearHref: string }) {
  return (
    <form method="get" className="jobfilter" role="search">
      <div className="row grow">
        <label className="lab" htmlFor={id}>{label}</label>
        <input id={id} name="q" type="text" enterKeyHint="search" autoComplete="off" maxLength={80} defaultValue={defaultValue} />
      </div>
      <div className="row"><button type="submit" className="btn sm">Search</button></div>
      {defaultValue && <div className="row"><Link href={clearHref} className="btn sm ghost">Clear</Link></div>}
    </form>
  );
}
