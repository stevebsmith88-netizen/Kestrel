import AppBarView from "@/components/AppBarView";
import type { Session } from "@/lib/auth";
import { findYourFitOn } from "@/lib/features";
import { unreadCount } from "@/lib/notifications";

// The bar across the top of every signed in page, drawn on the server. Pass the page's own address as `current` and its link is
// highlighted. The look lives in components/AppBarView.tsx, which the browser also uses on public pages (components/SessionBar.tsx).
export default async function AppBar({ session, current }: { session: Session; current?: string }) {
  // Candidates and clinics have an inbox, shown as an envelope beside the initials with the number of unread messages.
  const unread = session.role !== "admin" ? await unreadCount() : 0;
  return <AppBarView session={session} current={current} unread={unread} quiz={findYourFitOn()} />;
}
