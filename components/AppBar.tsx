import AppBarView from "@/components/AppBarView";
import { loadAdminCounts } from "@/lib/admin-counts";
import { buildAdminMenu } from "@/lib/admin-menu";
import { launchLayoutOn } from "@/lib/launch";
import type { Session } from "@/lib/auth";
import { findYourFitOn } from "@/lib/features";
import { unreadCount } from "@/lib/notifications";
import { planLineFor } from "@/lib/plan-line";

// The bar across the top of every signed in page, drawn on the server. Pass the page's own address as `current` and its link is
// highlighted. The look lives in components/AppBarView.tsx, which the browser also uses on public pages (components/SessionBar.tsx).
export default async function AppBar({ session, current }: { session: Session; current?: string }) {
  // Candidates and clinics have an inbox, shown as an envelope beside the initials with the number of unread messages.
  const unread = session.role !== "admin" ? await unreadCount() : 0;
  const planLine = session.role === "clinic" ? await planLineFor(session.userId) : null;
  // An admin sees what is waiting as badges in the menu, and the waitlist hides once sign up has opened (lib/admin-menu.ts).
  const adminMenu = session.role === "admin" ? buildAdminMenu(await loadAdminCounts(), await launchLayoutOn()) : undefined;
  return <AppBarView session={{ ...session, planLine }} current={current} unread={unread} quiz={findYourFitOn()} adminMenu={adminMenu} />;
}
