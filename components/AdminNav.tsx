"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { AdminMenu } from "@/lib/admin-menu";

// The admin links in the top bar: Dashboard, then Jobs and People as small drop downs, each with a count of what is waiting. A drop down
// closes when another page opens or when something else is pressed. The initials menu holds the tools used now and then.
function Badge({ n }: { n: number }) {
  return n > 0 ? <span className="navbadge">{n > 99 ? "99+" : n}<span className="sr"> waiting</span></span> : null;
}

export default function AdminNav({ menu }: { menu: AdminMenu }) {
  const path = usePathname() || "";
  const ref = useRef<HTMLDivElement>(null);
  const here = (href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(href + "/"));
  useEffect(() => {
    ref.current?.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"));
  }, [path]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      ref.current?.querySelectorAll("details[open]").forEach((d) => {
        if (!d.contains(e.target as Node)) d.removeAttribute("open");
      });
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <div className="adminnav" ref={ref}>
      <Link href={menu.dashboard.href} className="dashlink" aria-current={here(menu.dashboard.href) ? "page" : undefined}>
        {menu.dashboard.label}<Badge n={menu.dashboard.badge} />
      </Link>
      {menu.groups.map((g) => (
        <details key={g.label} className="adminnav-group">
          <summary className={g.items.some((i) => here(i.href)) ? "current" : undefined}>{g.label}<Badge n={g.badge} /></summary>
          <div className="adminnav-panel">
            {g.items.map((i) => (
              <Link key={i.href} href={i.href} aria-current={here(i.href) ? "page" : undefined}>{i.label}<Badge n={i.badge} /></Link>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
