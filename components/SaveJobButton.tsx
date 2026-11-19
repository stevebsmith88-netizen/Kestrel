"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SaveState } from "@/lib/saved-jobs";

// Save a job to apply for later (Steve, 19th November 2026). On the search page the website already knows whether it is saved, so it is passed in. On a
// job page, which is saved once and shown to everyone, the button asks the website in the browser. A signed out visitor is sent to sign in and back.
export default function SaveJobButton({ jobId, initial, small = false }: { jobId: string; initial?: "saved" | "not-saved"; small?: boolean }) {
  const [state, setState] = useState<SaveState | "loading">(initial ?? "loading");
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (initial) return;
    let live = true;
    fetch(`/api/saved?job=${encodeURIComponent(jobId)}`, { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { state: "hidden" }))
      .then((d: { state: SaveState }) => live && setState(d.state))
      .catch(() => live && setState("hidden"));
    return () => {
      live = false;
    };
  }, [jobId, initial]);

  async function change(save: boolean) {
    setPending(true);
    setNote("");
    try {
      const r = await fetch("/api/saved", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job: jobId, save }) });
      const d = (await r.json()) as { state?: SaveState; error?: string };
      if (d.state) setState(d.state);
      if (d.error) setNote(d.error);
    } catch {
      setNote("We couldn't save that just now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const size = small ? "btn sm ghost" : "btn ghost";
  if (state === "loading" || state === "hidden") return null;
  if (state === "signed-out") {
    if (small) return null;
    const next = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "%2Fjobs";
    return <Link href={`/sign-in?next=${next}`} className={size}>Sign in to save this job</Link>;
  }
  return (
    <span className="savebtn">
      {state === "saved" ? (
        <button type="button" className={size} onClick={() => change(false)} disabled={pending} aria-pressed="true">Saved. Remove</button>
      ) : (
        <button type="button" className={size} onClick={() => change(true)} disabled={pending} aria-pressed="false">Save job</button>
      )}
      {note && <span className="help" role="status">{note}</span>}
    </span>
  );
}
