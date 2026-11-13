"use client";

import { useEffect, useRef, useState } from "react";

// Find jobs on a phone (Steve, 13th November 2026): the filters sit behind a "Filters" button, so the first jobs are on the first screen.
// The filters themselves are unchanged and stay inside the search form, so "Show jobs" simply sends the form. On a wider screen the panel
// lays out exactly as before (app/globals.css, .sf-panel), and the button, header and footer are hidden. Without JavaScript the filters
// show in the page as they always did.
export default function MobileFilters({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    document.body.classList.add("sf-locked");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("sf-locked");
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => { setOpen(false); button.current?.focus(); };

  return (
    <>
      <div className="sf-mobilebar">
        <button ref={button} type="button" className="sf-filterbtn" aria-expanded={open} aria-controls="sf-panel" onClick={() => setOpen(true)}>
          Filters{count > 0 && <span className="sf-count" aria-label={`, ${count} in use`}>{count}</span>}
        </button>
      </div>
      <div id="sf-panel" className={`sf-panel${open ? " open" : ""}`} role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-labelledby={open ? "sf-panel-h" : undefined}>
        <div className="sf-panelhead">
          <h2 id="sf-panel-h" ref={heading} tabIndex={-1}>Filters</h2>
          <button type="button" className="linkbtn" onClick={close}>Close</button>
        </div>
        {children}
        <div className="sf-panelfoot">
          <a href="/jobs" className="linkbtn">Clear all</a>
          <button type="submit" className="btn">Show jobs</button>
        </div>
      </div>
      <noscript><style>{".sf-mobilebar,.sf-panelhead,.sf-panelfoot{display:none!important}.sf-panel{display:block!important;position:static!important}"}</style></noscript>
    </>
  );
}
