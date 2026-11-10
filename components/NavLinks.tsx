"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The links in the top bar of a signed in page. The one for the page you are on is highlighted, on account pages and public pages alike, so the
// bar looks and behaves the same everywhere. A dashboard link only matches its own address; the others also match the pages under them.
export default function NavLinks({ links, dashboard }: { links: { href: string; label: string }[]; dashboard: string }) {
  const path = usePathname() || "";
  return (
    <>
      {links.map((item) => {
        const current = item.href === dashboard ? path === item.href : path === item.href || path.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} className={item.href === dashboard ? "dashlink" : undefined} aria-current={current ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
