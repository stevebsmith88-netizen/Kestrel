import { getSession } from "@/lib/auth";
import { PERIODS, parsePeriod } from "@/lib/admin-stats";
import { loadStats } from "@/lib/admin-stats-data";

export const dynamic = "force-dynamic";

const cell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  // A leading = + - or @ can be run as a formula when the file is opened in a spreadsheet.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// The admin numbers as a spreadsheet. Admin only. Add kind=investor for just the investor snapshot.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") return new Response("Not found", { status: 404 });
  const url = new URL(request.url);
  const period = parsePeriod(url.searchParams.get("period") ?? undefined);
  const s = await loadStats(period);
  if (!s) return new Response("Not available", { status: 503 });

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? "";
  const investor: [string, unknown][] = [
    ["Posts per clinic", s.investor.postsPerClinic],
    ["Clinics that post again (percent)", s.investor.clinicsThatRepost],
    ["Applications per live job", s.investor.applicationsPerLiveJob],
    ["Monthly recurring revenue", "not on yet"],
    ["Free to paid conversion", "not on yet"],
  ];
  const all: [string, unknown][] = [
    ["Period", periodLabel],
    ["Live jobs", s.liveJobs],
    ["Jobs published in the period", s.publishedNow],
    ["Jobs published in the previous period", s.publishedBefore],
    ["Clinics and suppliers", s.employers],
    ["Claimed", s.claimedEmployers],
    ["Found online, not claimed", s.foundEmployers],
    ["Candidate accounts", s.candidateAccounts],
    ["Candidates who joined in the period", s.candidatesNow],
    ["Candidates who joined in the previous period", s.candidatesBefore],
    ["Applications in the period", s.applicationsNow],
    ["Applications in the previous period", s.applicationsBefore],
    ["Applications in total", s.applicationsTotal],
    ["Waitlist, who joined", s.waitlistTotal],
    ["Waitlist, confirmed", s.waitlistConfirmed],
    ...s.byProvince.map((p): [string, unknown] => [`Live jobs, ${p.label}`, p.count]),
    ...s.clinicFunnel.map((f): [string, unknown] => [`Clinic funnel, ${f.label}`, f.count]),
    ...s.candidateFunnel.map((f): [string, unknown] => [`Candidate funnel, ${f.label}`, f.count]),
    ...investor,
  ];
  const rows = url.searchParams.get("kind") === "investor" ? [["As of", s.asOf] as [string, unknown], ...investor] : [["As of", s.asOf] as [string, unknown], ...all];
  const body = ["measure,value", ...rows.map(([k, v]) => `${cell(k)},${cell(v)}`)].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kestrel-numbers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
