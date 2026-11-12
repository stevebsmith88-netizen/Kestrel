"use client";

import { useEffect, useState } from "react";
import AppBarView from "@/components/AppBarView";
import type { BarPerson } from "@/lib/account-menu";
import { SIGNED_IN_COOKIE } from "@/lib/session-cookie";

// On the public pages that are saved once for everyone (audit P1-10), the page arrives with the signed out header. If this browser holds a
// sign in cookie, this asks /api/me who it is and draws the same account bar as every other page in its place. The words about the person
// only ever exist in this browser: they are never part of the saved page.
type Me = BarPerson & { unread: number };


// Kept between pages, so moving from one public page to the next shows the bar straight away while it checks again.
let lastMe: Me | null = null;

export default function SessionBar({ quiz }: { quiz: boolean }) {
  const [me, setMe] = useState<Me | null>(lastMe);
  useEffect(() => {
    const root = document.documentElement;
    const signedOut = () => {
      lastMe = null;
      setMe(null);
      root.classList.remove("has-session", "session-ready");
    };
    if (!SIGNED_IN_COOKIE.test(document.cookie)) {
      signedOut();
      return;
    }
    let live = true;
    fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live) return;
        if (data?.signedIn) {
          lastMe = { role: data.role, email: data.email, fullName: data.fullName, unread: data.unread ?? 0 };
          setMe(lastMe);
          root.classList.add("session-ready");
        } else {
          signedOut();
        }
      })
      // If the check cannot be made, the signed out header stays, which is safe: Sign in leads to the dashboard anyway.
      .catch(() => live && signedOut());
    return () => {
      live = false;
    };
  }, []);
  return me ? <AppBarView session={me} current="" unread={me.unread} quiz={quiz} /> : null;
}
