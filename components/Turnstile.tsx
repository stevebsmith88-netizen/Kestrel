"use client";

import { useEffect, useRef, useState } from "react";

type Api = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: Api;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// The bot check. It shows nothing at all until the site key is set in Vercel. Put it inside a form: it sends the
// result along as "turnstileToken". Change `resetSignal` after each answer from the server, because a result can
// only be used once, and a fresh one is needed for the next try.
export default function Turnstile({ onToken, resetSignal }: { onToken?: (token: string) => void; resetSignal?: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [token, setToken] = useState("");
  const tell = useRef((value: string) => { setToken(value); onToken?.(value); });
  tell.current = (value: string) => { setToken(value); onToken?.(value); };

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !box.current || !window.turnstile || widget.current !== null) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (value: string) => tell.current(value),
        "expired-callback": () => tell.current(""),
        "error-callback": () => tell.current(""),
      });
    };
    if (window.turnstile) mount();
    else {
      let script = document.querySelector<HTMLScriptElement>('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]');
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
    }
    return () => {
      cancelled = true;
      if (widget.current !== null) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (widget.current !== null) {
      window.turnstile?.reset(widget.current);
      tell.current("");
    }
  }, [resetSignal]);

  if (!SITE_KEY) return null;
  return (
    <>
      <div className="turnstile" ref={box} role="group" aria-label="Security check" />
      <input type="hidden" name="turnstileToken" value={token} readOnly />
    </>
  );
}
