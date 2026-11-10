// The links under the initials badge, for a signed in person, and how the initials are made. One list used by the dashboard bar (AppBar) and
// the public header (SiteHeader), so the profile and account links are in the same place on every page, public or not.
// Kept free of imports from the app so it can be tested on its own (lib/account-menu.test.ts).
import type { Role } from "./auth.ts";

export type MenuLink = { href: string; label: string };

export const ACCOUNT_MENU: Record<Role, MenuLink[]> = {
  candidate: [
    { href: "/candidate/applications", label: "My applications" },
    { href: "/candidate/profile", label: "Profile and CV" },
    { href: "/account", label: "Account settings" },
  ],
  clinic: [
    { href: "/clinic/profile", label: "Clinic profile" },
    { href: "/account", label: "Account settings" },
  ],
  admin: [{ href: "/account", label: "Account settings" }],
};

export function initialsOf(fullName: string, email: string): string {
  const words = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  if (words.length === 1) return words[0][0].toUpperCase();
  return (email[0] || "?").toUpperCase();
}
