"use client";

import { useEffect, useRef, useState } from "react";
import { formatCount } from "@/lib/eye-care-numbers";

// A number that counts up to its real value over about 2 seconds, once it scrolls into view. The real value is what the page,
// a search engine, a screen reader and anyone with JavaScript off or "reduce motion" switched on all see.
export default function CountUp({ to, suffix = "", duration = 2000 }: { to: number; suffix?: string; duration?: number }) {
  const [shown, setShown] = useState(to);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let frame = 0;
    let started = false;
    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        setShown(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      setShown(0);
      frame = requestAnimationFrame(tick);
    };
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          watcher.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    watcher.observe(el);
    return () => {
      watcher.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to, duration]);

  return (
    <span ref={ref}>
      <span aria-hidden="true">{formatCount(shown)}{suffix}</span>
      <span className="sr">{formatCount(to)}{suffix === "+" ? " or more" : ""}</span>
    </span>
  );
}
