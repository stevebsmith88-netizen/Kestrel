// The links under the initials badge, for a signed in person, and how the initials are made. One list used by the dashboard bar (AppBar) and
// the public header (SiteHeader), so the profile and account links are in the same place on every page, public or not.
// Kept free of imports from the app so it can be tested on its own (lib/account-menu.test.ts).
import type { Role } from "./auth.ts";

// `group` puts a thin line between sets of links in the menu: the pages about you or your clinic first, then plans and help.
export type MenuLink = { href: string; label: string; group?: number };

// The little the top bar needs to know about a signed in person. On the public pages the browser fetches exactly this from /api/me.
export type BarPerson = { role: Role; email: string; fullName: string; planLine?: string | null };

// Each kind of account's dashboard. The same as homeFor in lib/auth.ts, kept here so the browser can use it too.
export const homeOf = (role: Role) => (role === "admin" ? "/admin" : role === "clinic" ? "/clinic" : "/candidate");

// Settings for a candidate or clinic is a gear icon beside the name inside the initials menu (Steve, 14th November 2026), so it is not repeated in the menu.
// The admin menu keeps its line until the Admin console review (next tasks, items 5 and 9).
export const SETTINGS_HREF = "/account";

export const ACCOUNT_MENU: Record<Role, MenuLink[]> = {
  // The inbox is the envelope beside the initials (and in the phone Menu), so it is not repeated here (Steve, 14th November 2026).
  candidate: [
    { href: "/candidate/applications", label: "My applications", group: 0 },
    { href: "/candidate/profile", label: "Profile and resume", group: 0 },
    { href: "/account/help", label: "Help and feedback", group: 1 },
  ],
  clinic: [
    { href: "/clinic/profile", label: "Clinic profile", group: 0 },
    { href: "/clinic/team", label: "Clinic team", group: 0 },
    { href: "/clinic/locations", label: "Locations", group: 0 },
    { href: "/clinic/plans", label: "Plans and billing", group: 1 },
    { href: "/account/help", label: "Help and feedback", group: 1 },
  ],
  // The tools used now and then (lib/admin-menu.ts has the list).
  admin: [
    { href: "/admin/payments", label: "Payments and Stripe" },
    { href: "/admin/outreach", label: "Outreach" },
    { href: "/admin/suppressions", label: "Do not email" },
  ],
};

export function initialsOf(fullName: string, email: string): string {
  const words = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  if (words.length === 1) return words[0][0].toUpperCase();
  return (email[0] || "?").toUpperCase();
}
