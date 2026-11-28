// The admin menu in one list (Steve, 14th November 2026; plan in docs/plans/admin-overhaul.md). The top bar, the phone menu and the initials menu all
// read it, so a page is added in 1 place. Each page can carry a count badge (jobs waiting, and so on). Kept free of the database so it can be tested.
// A virtual assistant's menu (next tasks, item 6) will be a shorter version of this same list.

export type AdminCounts = { review: number; support: number; claims: number; reports: number };
export const NO_COUNTS: AdminCounts = { review: 0, support: 0, claims: 0, reports: 0 };

type Page = { href: string; label: string; count?: keyof AdminCounts; prelaunchOnly?: boolean };

export const ADMIN_DASHBOARD: Page = { href: "/admin", label: "Dashboard" };

export const ADMIN_GROUPS: { label: string; pages: Page[] }[] = [
  {
    label: "Jobs",
    pages: [
      { href: "/admin/review", label: "Review queue", count: "review" },
      { href: "/admin/jobs", label: "All jobs" },
      { href: "/admin/found", label: "Found listings" },
      { href: "/admin/post-for-clinic", label: "Post for a clinic" },
      { href: "/admin/reports", label: "Reported jobs", count: "reports" },
    ],
  },
  {
    label: "People",
    pages: [
      { href: "/admin/clinics", label: "Clinics" },
      { href: "/admin/candidates", label: "Candidates" },
      { href: "/admin/claims", label: "Claims", count: "claims" },
      { href: "/admin/interest", label: "Interest in clinics" },
      { href: "/admin/requests", label: "Support", count: "support" },
      // The waitlist goes quiet once sign up opens, so it hides then.
      { href: "/admin/waitlist", label: "Waitlist", prelaunchOnly: true },
    ],
  },
];

// Under the initials: the tools used now and then.
export const ADMIN_MORE: Page[] = [
  { href: "/admin/payments", label: "Payments and Stripe" },
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/outreach", label: "Outreach" },
  { href: "/admin/suppressions", label: "Do not email" },
];

export type MenuItem = { href: string; label: string; badge: number };
export type AdminMenu = {
  dashboard: MenuItem; // its badge is the total waiting
  groups: { label: string; badge: number; items: MenuItem[] }[];
  more: { href: string; label: string }[];
};

export const totalWaiting = (c: AdminCounts) => c.review + c.support + c.claims + c.reports;

export function buildAdminMenu(counts: AdminCounts = NO_COUNTS, launched = false): AdminMenu {
  const item = (p: Page): MenuItem => ({ href: p.href, label: p.label, badge: p.count ? counts[p.count] : 0 });
  return {
    dashboard: { ...item(ADMIN_DASHBOARD), badge: totalWaiting(counts) },
    groups: ADMIN_GROUPS.map((g) => {
      const items = g.pages.filter((p) => !(p.prelaunchOnly && launched)).map(item);
      return { label: g.label, badge: items.reduce((sum, i) => sum + i.badge, 0), items };
    }),
    more: ADMIN_MORE.map(({ href, label }) => ({ href, label })),
  };
}

// Every address in the menu, so a test can check no admin page is left out.
export const adminMenuHrefs = (): string[] => [ADMIN_DASHBOARD.href, ...ADMIN_GROUPS.flatMap((g) => g.pages.map((p) => p.href)), ...ADMIN_MORE.map((p) => p.href)];
