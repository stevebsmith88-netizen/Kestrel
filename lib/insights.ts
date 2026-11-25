// Insights for blog posts (Steve, 14th November 2026, built 19th November 2026). Admin only, aggregate figures only: never a name, an email or a resume,
// and a count under 5 shows as "fewer than 5" so a post never points to 1 clinic or 1 person. Pay uses Kestrel's own posted pay only when there are
// enough posts (see ownPayStats), and says "typical" and "median". Nothing here comes from Indeed, LinkedIn or any other job board.
import { ownPayStats, OWN_DATA_MIN_CLINICS, OWN_DATA_MIN_POSTS, type PostedPayRow } from "./pay-benchmark.ts";

export const SMALL_COUNT = 5;

export type Counted = { label: string; count: number; shown: string };
export type InsightsInput = {
  candidates: { profession: string | null; home_province: string | null }[];
  employers: { id: string; practice_type: string; owner_id: string | null }[];
  jobs: (PostedPayRow & { is_seeded: boolean; status: string; posted_at: string | null })[];
};

// A count under 5 is never shown as a number.
export const showCount = (n: number) => (n === 0 ? "0" : n < SMALL_COUNT ? `fewer than ${SMALL_COUNT}` : n.toLocaleString("en-CA"));

function tally(values: (string | null | undefined)[], blank = "Not given"): Counted[] {
  const map = new Map<string, number>();
  for (const v of values) {
    const key = v && v.trim() ? v.trim() : blank;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count, shown: showCount(count) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const dollars = (n: number) => `$${Math.round(n).toLocaleString("en-CA")} a year`;

export function buildInsights(input: InsightsInput) {
  const registered = input.employers.filter((e) => e.owner_id);
  const clinics = registered.filter((e) => e.practice_type !== "supplier");
  const suppliers = registered.filter((e) => e.practice_type === "supplier");
  const clinicIds = new Set(clinics.map((e) => e.id));
  const supplierIds = new Set(suppliers.map((e) => e.id));
  // Jobs a person posted and Kestrel approved, never found listings or drafts.
  const posted = input.jobs.filter((j) => !j.is_seeded && j.posted_at && ["live", "closed", "expired"].includes(j.status));
  const clinicJobs = posted.filter((j) => clinicIds.has(j.employer_id));
  const supplierJobs = posted.filter((j) => supplierIds.has(j.employer_id));
  const pay = ownPayStats(posted)
    .sort((a, b) => a.role.localeCompare(b.role) || a.province.localeCompare(b.province))
    .map((p) => ({ role: p.role, province: p.province, posts: p.posts, clinics: p.clinics, low: dollars(p.low), median: dollars(p.median), high: dollars(p.high) }));
  return {
    candidates: {
      total: input.candidates.length,
      totalShown: showCount(input.candidates.length),
      byProfession: tally(input.candidates.map((c) => c.profession)),
      byProvince: tally(input.candidates.map((c) => c.home_province)),
    },
    clinics: {
      registered: clinics.length,
      registeredShown: showCount(clinics.length),
      postsTotal: clinicJobs.length,
      postsShown: showCount(clinicJobs.length),
      postsByRole: tally(clinicJobs.map((j) => j.role_category)),
      postsByProvince: tally(clinicJobs.map((j) => j.province)),
    },
    suppliers: {
      registered: suppliers.length,
      registeredShown: showCount(suppliers.length),
      rolesPosted: supplierJobs.length,
      rolesShown: showCount(supplierJobs.length),
      rolesByRole: tally(supplierJobs.map((j) => j.role_category)),
    },
    pay,
    payRule: `Kestrel's own pay figures appear only when a role and province has at least ${OWN_DATA_MIN_POSTS} posts from at least ${OWN_DATA_MIN_CLINICS} clinics. Until then use the Job Bank figure, labelled, and say "typical" or "median", never "average".`,
  };
}

export type Insights = ReturnType<typeof buildInsights>;

// One flat list for the spreadsheet: section, view, label, value.
export function insightsRows(i: Insights): string[][] {
  const rows: string[][] = [["Section", "View", "Label", "Value"]];
  const add = (section: string, view: string, items: Counted[]) => items.forEach((c) => rows.push([section, view, c.label, c.shown]));
  rows.push(["Candidates", "Total", "Candidate accounts", i.candidates.totalShown]);
  add("Candidates", "By profession", i.candidates.byProfession);
  add("Candidates", "By province", i.candidates.byProvince);
  rows.push(["Clinics", "Total", "Clinics registered", i.clinics.registeredShown]);
  rows.push(["Clinics", "Total", "Jobs posted", i.clinics.postsShown]);
  add("Clinics", "Jobs posted by role", i.clinics.postsByRole);
  add("Clinics", "Jobs posted by province", i.clinics.postsByProvince);
  rows.push(["Suppliers", "Total", "Suppliers registered", i.suppliers.registeredShown]);
  rows.push(["Suppliers", "Total", "Roles posted", i.suppliers.rolesShown]);
  add("Suppliers", "Roles posted by type", i.suppliers.rolesByRole);
  for (const p of i.pay) rows.push(["Pay", `${p.role}, ${p.province}`, `Typical (median), middle half ${p.low} to ${p.high}`, `${p.median} (${p.posts} posts, ${p.clinics} clinics)`]);
  return rows;
}
