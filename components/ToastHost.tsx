"use client";

import { useEffect, useRef, useState } from "react";
import { TOAST_EVENT, type ToastTone } from "@/components/toast";

const SHOWN_FOR_MS = 8000;

// The place where small messages appear (see components/toast.ts). It is always on the page, empty until something happens, so
// screen readers are told when a message arrives. It stays in view as the page scrolls, and goes by itself after a few seconds.
export default function ToastHost() {
  const [toast, setToast] = useState<{ text: string; tone: ToastTone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function show(e: Event) {
      const detail = (e as CustomEvent<{ text: string; tone: ToastTone }>).detail;
      if (!detail?.text) return;
      setToast(detail);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(null), SHOWN_FOR_MS);
    }
    window.addEventListener(TOAST_EVENT, show);
    return () => {
      window.removeEventListener(TOAST_EVENT, show);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="toasts" role="status" aria-live="polite" aria-atomic="true">
      {toast && (
        <div className={`toast${toast.tone === "warn" ? " warn" : ""}`}>
          <p>{toast.text}</p>
          <button type="button" className="linkbtn" onClick={() => setToast(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
