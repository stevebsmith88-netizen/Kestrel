"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FollowState } from "@/lib/follows";

// Follow a clinic or company (Steve, 19th November 2026). The public page it sits on is saved once and shown to everyone, so the button asks the
// website in the browser, with the visitor's own cookie, whether they are signed in and already follow. A visitor who is signed out is sent to sign
// in and back to this page. A clinic or admin sees nothing.
export default function FollowButton({ employerId, name }: { employerId: string; name: string }) {
  const [state, setState] = useState<FollowState | "loading">("loading");
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let live = true;
    fetch(`/api/follow?employer=${encodeURIComponent(employerId)}`, { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { state: "hidden" }))
      .then((d: { state: FollowState }) => live && setState(d.state))
      .catch(() => live && setState("hidden"));
    return () => {
      live = false;
    };
  }, [employerId]);

  async function change(follow: boolean) {
    setPending(true);
    setNote("");
    try {
      const r = await fetch("/api/follow", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employer: employerId, follow }) });
      const d = (await r.json()) as { state?: FollowState; message?: string; error?: string };
      if (d.state) setState(d.state);
      setNote(d.error ?? d.message ?? "");
    } catch {
      setNote("We couldn't save that just now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (state === "loading" || state === "hidden") return null;
  if (state === "signed-out") {
    const next = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "%2Fjobs";
    return (
      <span className="followbtn">
        <Link href={`/sign-in?next=${next}`} className="btn sm ghost">Sign in to follow {name}</Link>
      </span>
    );
  }
  return (
    <span className="followbtn">
      {state === "following" ? (
        <button type="button" className="btn sm ghost" onClick={() => change(false)} disabled={pending} aria-pressed="true">Following. Unfollow</button>
      ) : (
        <button type="button" className="btn sm" onClick={() => change(true)} disabled={pending} aria-pressed="false">Follow for new jobs</button>
      )}
      {note && <span className="help" role="status">{note}</span>}
    </span>
  );
}
