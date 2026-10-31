"use client";

import { useEffect } from "react";

// The phone menu is a plain <details>, which stays open after Escape or after tabbing away from it. This closes it
// on Escape (and returns focus to the Menu button), and when keyboard focus moves out of it.
export default function CloseMenuOnEscape() {
  useEffect(() => {
    const openMenus = () => Array.from(document.querySelectorAll<HTMLDetailsElement>("header details.site-narrow[open]"));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      for (const menu of openMenus()) {
        menu.open = false;
        menu.querySelector<HTMLElement>("summary")?.focus();
      }
    };
    const onFocus = (e: FocusEvent) => {
      for (const menu of openMenus()) if (e.target instanceof Node && !menu.contains(e.target)) menu.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);
  return null;
}
