"use client";

import { useState } from "react";

// Copies a short piece of text, such as a registration number, and says so. Falls back quietly if the browser does not allow it.
export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      setDone(false);
    }
  }
  return (
    <button type="button" className="btn sm ghost" onClick={copy} aria-live="polite">
      {done ? "Copied" : label}
    </button>
  );
}
