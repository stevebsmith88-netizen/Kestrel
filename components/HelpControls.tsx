"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HELP_OPEN_BY_DEFAULT, SEARCH_OPEN_LIMIT, topicMatches, type HelpSectionId } from "@/lib/help";

// The small piece of script behind the help centre. The boxes themselves are plain details elements and work without it. This adds:
//  1. Search. Typing shows only the topics that match (rules in lib/help.ts), opens the sections that have a match, and opens the topics
//     themselves when only a few match. Clearing the box puts the page back as it first looked (General open, the rest closed).
//  2. Deep links. /help#post-a-job opens the section and the topic and scrolls to it, on load and whenever the address changes.
//  3. The address follows the topic a person opens, so the link in the address bar can be copied and sent to someone.
//  4. Expand all and Collapse all.
// The search box and buttons are shown only once this script has run, so nobody sees controls that do nothing.
export default function HelpControls() {
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<{ text: string; none: boolean }>({ text: "", none: false });
  const bulk = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const filterOn = useRef(false);

  const boxes = () => {
    const root = document.getElementById("help-root");
    return {
      root,
      topics: root ? [...root.querySelectorAll<HTMLDetailsElement>("details.help-topic")] : [],
      sections: root ? [...root.querySelectorAll<HTMLDetailsElement>("details.help-section")] : [],
    };
  };

  // Shows only what matches `q`. An empty search puts every box back, closed.
  const applyFilter = (q: string) => {
    const { topics, sections } = boxes();
    bulk.current = true;
    if (!q.trim()) {
      // Back to how the page first looked: every topic closed, and only the sections that start open are open.
      topics.forEach((d) => { d.hidden = false; d.open = false; });
      sections.forEach((d) => { d.hidden = false; d.open = HELP_OPEN_BY_DEFAULT.includes(d.id as HelpSectionId); });
      filterOn.current = false;
      setStatus({ text: "", none: false });
    } else {
      filterOn.current = true;
      const hits = topics.filter((d) => topicMatches(q, `${d.textContent ?? ""} ${d.dataset.keywords ?? ""}`));
      topics.forEach((d) => { const hit = hits.includes(d); d.hidden = !hit; d.open = hit && hits.length <= SEARCH_OPEN_LIMIT; });
      sections.forEach((s) => { const any = Boolean(s.querySelector("details.help-topic:not([hidden])")); s.hidden = !any; s.open = any; });
      setStatus(hits.length === 0
        ? { text: "No topics match. Try fewer or different words, or ", none: true }
        : { text: `${hits.length} ${hits.length === 1 ? "topic" : "topics"} found.`, none: false });
    }
    bulk.current = false;
  };

  const clearSearch = () => {
    setQuery("");
    applyFilter("");
    input.current?.focus();
  };

  useEffect(() => {
    const root = document.getElementById("help-root");
    if (!root) return;
    setReady(true);

    const openFromAddress = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target || !root.contains(target) || target.tagName !== "DETAILS") return;
      // A search can be hiding the target, so it steps aside first.
      if (filterOn.current) { setQuery(""); applyFilter(""); }
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
    // The handlers only use refs and state setters, so they are set up once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAll = (open: boolean) => {
    const { topics, sections } = boxes();
    bulk.current = true;
    [...sections, ...topics].forEach((d) => { if (!d.hidden) d.open = open; });
    bulk.current = false;
    if (!open && window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  if (!ready) return null;
  return (
    <>
      <div className="help-search">
        <label className="lab" htmlFor="help-search">Search the help centre</label>
        <div className="help-searchrow">
          <input
            ref={input}
            id="help-search"
            type="search"
            autoComplete="off"
            value={query}
            placeholder="For example: password, resume, withdraw"
            onChange={(e) => { setQuery(e.target.value); applyFilter(e.target.value); }}
            onKeyDown={(e) => { if (e.key === "Escape" && query) { e.preventDefault(); clearSearch(); } }}
          />
          {query && <button type="button" className="btn sm ghost" onClick={clearSearch}>Clear</button>}
        </div>
        <p className="help-status" role="status">
          {status.text}
          {status.none && <><Link href="/contact">contact us</Link>.</>}
        </p>
      </div>
      <p className="help-controls">
        <button type="button" className="btn sm ghost" onClick={() => setAll(true)}>Expand all</button>
        <button type="button" className="btn sm ghost" onClick={() => setAll(false)}>Collapse all</button>
      </p>
    </>
  );
}
