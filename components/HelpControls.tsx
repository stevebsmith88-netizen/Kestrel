"use client";

import { useEffect, useRef, useState } from "react";

// The small piece of script behind the help centre. The boxes themselves are plain details elements and work without it. This adds:
//  1. Deep links. /help#post-a-job opens the section and the topic and scrolls to it, on load and whenever the address changes.
//  2. The address follows the topic a person opens, so the link in the address bar can be copied and sent to someone.
//  3. Expand all and Collapse all, shown only once this script has run so nobody sees buttons that do nothing.
export default function HelpControls() {
  const [ready, setReady] = useState(false);
  const bulk = useRef(false);

  useEffect(() => {
    const root = document.getElementById("help-root");
    if (!root) return;
    setReady(true);

    const openFromAddress = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target || !root.contains(target) || target.tagName !== "DETAILS") return;
      bulk.current = true;
      // Open every box around the target, from the outside in, then the target itself.
      let node: HTMLElement | null = target;
      const chain: HTMLDetailsElement[] = [];
      while (node && node !== root) {
        if (node.tagName === "DETAILS") chain.unshift(node as HTMLDetailsElement);
        node = node.parentElement;
      }
      chain.forEach((d) => { d.open = true; });
      bulk.current = false;
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: "start" });
        target.querySelector("summary")?.focus({ preventScroll: true });
      });
    };

    // A topic that opens puts its own id in the address (without scrolling, and without adding to the back button history).
    const onToggle = (event: Event) => {
      const d = event.target as HTMLElement;
      if (bulk.current || !(d instanceof HTMLDetailsElement) || !d.classList.contains("help-topic")) return;
      const here = `#${d.id}`;
      if (d.open) window.history.replaceState(null, "", here);
      else if (window.location.hash === here) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    };

    openFromAddress();
    window.addEventListener("hashchange", openFromAddress);
    root.addEventListener("toggle", onToggle, true);
    return () => {
      window.removeEventListener("hashchange", openFromAddress);
      root.removeEventListener("toggle", onToggle, true);
    };
  }, []);

  const setAll = (open: boolean) => {
    bulk.current = true;
    document.querySelectorAll<HTMLDetailsElement>("#help-root details").forEach((d) => { d.open = open; });
    bulk.current = false;
    if (!open && window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  if (!ready) return null;
  return (
    <p className="help-controls">
      <button type="button" className="btn sm ghost" onClick={() => setAll(true)}>Expand all</button>
      <button type="button" className="btn sm ghost" onClick={() => setAll(false)}>Collapse all</button>
    </p>
  );
}
